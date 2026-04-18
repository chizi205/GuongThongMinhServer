const bcrypt = require("bcryptjs");
const accountRepo = require("../../repositories/admin/account.repo");

const getMe = async (userId) => {
  if (!userId) throw new Error("Phiên đăng nhập không hợp lệ");
  
  const account = await accountRepo.getAccountById(userId);
  if (!account) throw new Error("Không tìm thấy tài khoản");
  
  return account;
};

const updateProfile = async (userId, { email, full_name, username, confirmPassword }) => {
  if (!userId) throw new Error("Phiên đăng nhập không hợp lệ");
  
  // ---> THÊM ĐOẠN NÀY ĐỂ XÁC NHẬN MẬT KHẨU <---
  if (!confirmPassword) throw new Error("Vui lòng nhập mật khẩu để xác nhận!");
  const accountHash = await accountRepo.getPasswordHash(userId);
  const isMatch = await bcrypt.compare(confirmPassword, accountHash.password_hash);
  if (!isMatch) throw new Error("Mật khẩu xác nhận không chính xác!");
  // -------------------------------------------

  const currentAccount = await accountRepo.getAccountById(userId);
  if (!currentAccount) throw new Error("Không tìm thấy tài khoản");

  let finalUsername = currentAccount.username;
  if (currentAccount.role === "admin" && username) {
    finalUsername = username;
  }

  return await accountRepo.updateProfile(userId, {
    email,
    full_name,
    username: finalUsername
  });
};

const changePassword = async (userId, { oldPassword, newPassword }) => {
  if (!userId) throw new Error("Phiên đăng nhập không hợp lệ");

  const account = await accountRepo.getPasswordHash(userId);
  if (!account) throw new Error("Tài khoản không tồn tại");

  // Kiểm tra mật khẩu cũ
  const isMatch = await bcrypt.compare(oldPassword, account.password_hash);
  if (!isMatch) throw new Error("Mật khẩu hiện tại không chính xác!");

  // Mã hóa mật khẩu mới
  const salt = await bcrypt.genSalt(10);
  const newHash = await bcrypt.hash(newPassword, salt);
  
  await accountRepo.updatePassword(userId, newHash);
};

module.exports = {
  getMe,
  updateProfile,
  changePassword,
};