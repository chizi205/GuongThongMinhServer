const path = require("path");
const fs = require("fs");
const axios = require("axios");
const sessionService = require("./session.service");
const tryonRepo = require("../../repositories/kiosk/tryon.repo");
const fitroom = require("../external/fitroom.client");

const uploadBodyImage = async ({
  kiosk_id,
  kiosk_account_id,
  file,
  publicUrl,
}) => {
  if (!file) {
    const err = new Error("MISSING_BODY_IMAGE");
    err.status = 400;
    throw err;
  }
  if (!kiosk_id || !kiosk_account_id) {
    const err = new Error("MISSING_KIOSK_CONTEXT");
    err.status = 400;
    throw err;
  }

  const session = await sessionService.ensureActiveSession({
    kiosk_id,
    kiosk_account_id,
  });

  const bodyImageUrl = `/${file.path.replace(/\\/g, "/")}`;

  await tryonRepo.updateCustomerImageUrl(session.id, bodyImageUrl);

  const temp = await tryonRepo.insertTempImage({
    kiosk_session_id: session.id,
    filename: file.filename,
    url: bodyImageUrl,
  });

  return {
    kiosk_session_id: session.id,
    temp_image_id: temp.id,
    bodyImageUrl,
  };
};

const allowedClothTypes = ["upper", "lower", "full"];

const processTryOn = async ({
  kiosk_session_id,
  temp_image_id,
  product_variant_id,
  cloth_type,
  shop_id,
  hdMode
}) => {
  if (!kiosk_session_id || !temp_image_id || !product_variant_id) {
    const err = new Error("MISSING_PARAMS");
    err.status = 400;
    throw err;
  }

  const clothType = cloth_type || "upper";
  if (!allowedClothTypes.includes(clothType)) {
    // ĐÃ SỬA: Trong Service không có biến `res`, phải throw Error
    const err = new Error("INVALID_CLOTH_TYPE");
    err.status = 400;
    err.extra = { good_clothes_types: allowedClothTypes };
    throw err;
  }

  const temp = await tryonRepo.getTempImage({
    temp_image_id,
    kiosk_session_id,
  });
  if (!temp) {
    const err = new Error("TEMP_IMAGE_NOT_FOUND");
    err.status = 400;
    throw err;
  }

  const variant = await tryonRepo.getVariant({ product_variant_id });
  if (!variant) {
    const err = new Error("VARIANT_NOT_FOUND");
    err.status = 400;
    throw err;
  }

  const clothFilename = variant.model_3d_url;
  if (!clothFilename) {
    const err = new Error("CLOTH_IMAGE_MISSING");
    err.status = 400;
    throw err;
  }

  const modelFilePath = path.join(process.cwd(), temp.url);
  const clothFilePath = path.join(process.cwd(), clothFilename);

  const task = await fitroom.createTryOnTask(
    modelFilePath,
    clothFilePath,
    clothType,
    hdMode,
  );

  const finalResult = await fitroom.pollTaskUntilComplete(task.task_id);

  if (!finalResult?.download_signed_url) {
    const err = new Error("FITROOM_NO_DOWNLOAD_URL");
    err.status = 502;
    throw err;
  }

  const safeShopId = shop_id || "default_shop";
  const dirPath = path.join(
    process.cwd(),
    "uploads",
    "tryons",
    "results",
    safeShopId.toString(),
  );

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const timestamp = Date.now();
  const newFilename = `tryon_${kiosk_session_id}_${timestamp}.jpg`;
  const localSavePath = path.join(dirPath, newFilename);

  const response = await axios({
    url: finalResult.download_signed_url,
    method: "GET",
    responseType: "stream",
  });

  const writer = fs.createWriteStream(localSavePath);
  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  if (!fs.existsSync(localSavePath) || fs.statSync(localSavePath).size === 0) {
    throw new Error("DOWNLOADED_FILE_INVALID");
  }

  const publicUrl = `/uploads/tryons/results/${safeShopId}/${newFilename}`;

  const saved = await tryonRepo.insertTryOn({
    kiosk_session_id,
    product_variant_id,
    image_url: publicUrl,
    metadata: {
      ...finalResult,
      original_fitroom_url: finalResult.download_signed_url,
      saved_filename: newFilename,
    },
  });

  await tryonRepo.markTempUsed({ temp_image_id });

  return {
    try_on_id: saved.id,
    downloadUrl: saved.image_url,
    status: finalResult.status,
  };
};

module.exports = { uploadBodyImage, processTryOn };
