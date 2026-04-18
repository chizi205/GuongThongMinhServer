const path = require("path");
const pool = require("../../config/database");

const fitroom = require("../../services/external/fitroom.client");
const ZaloService = require("../../services/external/zalooa.client");

const CloudinaryModule = require("../../utils/upClound"); 
const CloudinaryService = CloudinaryModule.default || CloudinaryModule; 

const { ok, serverError, badRequest } = require("../../utils/response");

const getLatestUserImage = async (userId, shopId) => {
  const query = `
    SELECT image_url 
    FROM shop_users 
    WHERE user_id = $1 AND shop_id = $2
    LIMIT 1;
  `;
  const { rows } = await pool.query(query, [userId, shopId]);
  
  let imageUrl = rows[0]?.image_url;
  if (imageUrl) {
    if (imageUrl.startsWith('/uploads')) {
      const baseUrl = process.env.PUBLIC_URL;
      imageUrl = `${baseUrl}${imageUrl}`;
    }
  }
  return imageUrl;
};

const getProductImage = async (productId) => {
  const query = `
    SELECT model_3d_url, image_urls 
    FROM product_variants 
    WHERE product_id = $1 
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [productId]);
  
  let imageUrl = null;

  if (rows.length > 0) {
    if (rows[0].model_3d_url) {
      imageUrl = rows[0].model_3d_url;
    } else if (rows[0].image_urls && rows[0].image_urls.length > 0) {
      imageUrl = rows[0].image_urls[0];
    }
  }
  
  if (imageUrl) {
    if (imageUrl.startsWith('/uploads')) {
      const baseUrl = process.env.PUBLIC_URL;
      imageUrl = `${baseUrl}${imageUrl}`;
    }
  }
  
  return imageUrl;
};

// --- CONTROLLER CHÍNH: MARKETING TỰ ĐỘNG ---
const sendMarketingTryOn = async (req, res) => {
  try {
    const { userIds, productIds, shopId } = req.body;
    
    if (!userIds || !productIds || !shopId) {
      return badRequest(res, "Thiếu userIds, productIds hoặc shopId");
    }

    console.log(`\x1b[36m>>> [START] Chiến dịch Marketing: Shop ${shopId}\x1b[0m`);
    const finalReport = [];

    // VÒNG LẶP 1: Chạy từng người dùng
    for (const userId of userIds) {
      console.log(`\n\x1b[33m--- Xử lý Khách hàng: ${userId} ---\x1b[0m`);
      
      const userImage = await getLatestUserImage(userId, shopId);
      if (!userImage) {
        console.log(`\x1b[31m[!] User ${userId} chưa có ảnh gốc (image_url) trong shop_users, bỏ qua!\x1b[0m`);
        finalReport.push({ userId, status: "FAILED", reason: "Không tìm thấy ảnh gốc trong shop_users" });
        continue; 
      }

      // =========================================================================
      // BƯỚC MỚI: TUNG TIN NHẮN MỒI CHECK ZALO (TRÁNH LÃNG PHÍ TIỀN GỌI AI)
      // =========================================================================
      try {
        console.log(`  -> Gửi tin nhắn mồi check trạng thái Zalo (24h/Follow)...`);
        await ZaloService.sendText(
            shopId, 
            userId,
"Hệ thống Gương Thông Minh gợi ý các sản phẩm này rất hợp với bạn. Hãy ghé cửa hàng để trải nghiệm nhé!"
        );
      } catch (zaloErr) {
        console.log(`\x1b[31m[!] Zalo chặn gửi tin. Dừng gọi AI cho khách này để tiết kiệm!\x1b[0m`);
        
        let errorReason = "Lỗi gửi Zalo không xác định";
        if (zaloErr.message === "USER_NOT_LINKED_ZALO") {
            errorReason = "Khách hàng chưa liên kết Zalo ID";
        } else if (zaloErr.response && zaloErr.response.data) {
             const zaloErrorData = zaloErr.response.data;
             if (zaloErrorData.error === -213 || zaloErrorData.error === -139) {
                 errorReason = "Zalo chặn: Khách chưa tương tác trong 24h qua";
             } else if (zaloErrorData.error === -212 || zaloErrorData.error === -214) {
                 errorReason = "Zalo chặn: Khách chưa quan tâm OA hoặc đã chặn tin";
             } else {
                 errorReason = `Lỗi Zalo (${zaloErrorData.error}): ${zaloErrorData.message}`;
             }
        } else if (zaloErr.message === "QUÁ_24H") {
             errorReason = "Zalo chặn: Khách chưa tương tác trong 24h qua";
        } else if (zaloErr.message === "CHƯA_QUAN_TÂM_OA") {
             errorReason = "Zalo chặn: Khách chưa quan tâm OA hoặc đã chặn tin";
        } else {
             errorReason = typeof zaloErr === 'string' ? zaloErr : zaloErr.message;
        }

        finalReport.push({ userId, status: "ZALO_FAILED", reason: errorReason });
        continue; // Lệnh này bỏ qua khách hàng hiện tại, KHÔNG chạy xuống gọi AI nữa
      }
      // =========================================================================

      // NẾU CODE CHẠY XUỐNG ĐÂY TỨC LÀ ZALO MỞ -> AN TÂM GỌI AI
      const listGeneratedImageUrls = [];

      // VÒNG LẶP 2: Chạy từng sản phẩm cho user hiện tại
      for (const productId of productIds) {
        try {
          const productImage = await getProductImage(productId);
          if (!productImage) {
            console.log(`[!] Sản phẩm ${productId} không có ảnh, bỏ qua.`);
            continue;
          }

          console.log(`  -> Gửi AI Fitroom (Product: ${productId})...`);
          
          const task = await fitroom.createTryOnTask(userImage, productImage, "upper", true);
          const result = await fitroom.pollTaskUntilComplete(task.task_id);

          if (result && result.download_signed_url) {
            const tempAiUrl = result.download_signed_url;

            console.log(`  -> Đang lưu ảnh lên Cloudinary...`);
            const uploadRes = await CloudinaryService.uploadSingleImage(tempAiUrl, "marketing_tryon");

            if (uploadRes && uploadRes.secure_url) {
              listGeneratedImageUrls.push(uploadRes.secure_url);
              console.log(`  [OK] Đã tạo ảnh: ${uploadRes.secure_url}`);
            }
}
        } catch (err) {
          console.error(`\x1b[31m  [!] Lỗi Fitroom tại SP ${productId}:\x1b[0m`, err.message);
        }
      }

      // VÒNG LẶP 3: Gửi ảnh AI sinh ra qua Zalo
      if (listGeneratedImageUrls.length > 0) {
        try {
          console.log(`\x1b[32m>>> [Zalo] Đang gửi ${listGeneratedImageUrls.length} ảnh cho ${userId}...\x1b[0m`);
          
          await ZaloService.sendImages(shopId, userId, listGeneratedImageUrls);
          await ZaloService.sendText(shopId, userId, "Ta-da! 🎉 Đây là kết quả gợi ý. Hãy ghé cửa hàng để trải nghiệm nhé!");
          
          finalReport.push({ userId, status: "SUCCESS", imagesSent: listGeneratedImageUrls.length });
        } catch (zaloErr) {
          console.error(`\x1b[31m>>> [Zalo] Thất bại lúc gửi ảnh:\x1b[0m`, zaloErr.message || zaloErr);
          finalReport.push({ userId, status: "ZALO_FAILED", reason: "Lỗi gửi ảnh (Dù tin nhắn mồi đã thành công)" });
        }
      } else {
        finalReport.push({ userId, status: "FAILED", reason: "Tất cả sản phẩm đều ghép lỗi AI" });
      }
    }

    console.log(`\x1b[36m>>> [DONE] Đã hoàn tất chiến dịch!\x1b[0m`);
    
    return ok(res, 200, {
      message: "Chiến dịch gửi Marketing hoàn tất",
      data: finalReport
    });

  } catch (error) {
    console.error("Lỗi sendMarketingTryOn:", error);
    return serverError(res, "Lỗi hệ thống khi gửi Marketing", error);
  }
};

const sendImagesForAdmin = async (req, res) => {
  try {
    const { user_id, images, shop_id } = req.body;

    if (!images || images.length === 0) {
      return serverError(res, "MISSING_IMAGES");
    }

    if (!user_id || !shop_id) {
      return badRequest(res, "Thiếu user_id hoặc shop_id");
    }

    const data = await ZaloService.sendImages(shop_id, user_id, images);

    return ok(res, 200, {
      message: "SEND_IMAGES_SUCCESS",
      data,
    });
  } catch (err) {
    if (err.message === "USER_NOT_LINKED_ZALO") {
      return serverError(res, "USER_NOT_FOLLOW_ZALO_OA");
    }
    return serverError(res, err.message);
  }
};

module.exports = {
  sendMarketingTryOn,
  sendImagesForAdmin
};
