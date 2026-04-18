const measurementPlanRepo = require("../../repositories/admin/measurementPlan.repo");
const ExcelJS = require('exceljs');

const getColLetter = (colIndex) => {
  let temp, letter = '';
  while (colIndex > 0) {
    temp = (colIndex - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    colIndex = (colIndex - temp - 1) / 26;
  }
  return letter;
};

// Hàm hỗ trợ lọc bỏ size XXL
const filterSize = (sizeStr) => {
  if (!sizeStr) return '';
  let cleanStr = sizeStr.replace(/\bXXL\b/gi, '').trim();
  cleanStr = cleanStr.replace(/^,+|,+$/g, '').trim();
  return cleanStr;
};

const createPlanService = async (data) => {
  const { shop_id, name, note, status, created_by } = data;
  if (!shop_id || !name) {
    throw new Error("BAD_REQUEST: Vui lòng cung cấp đầy đủ thông tin bắt buộc: shop_id và name.");
  }
  return await measurementPlanRepo.createMeasurementPlan({ shop_id, name, note, status, created_by });
};

const getPlansService = async (shop_id, searchKeyword) => {
  return await measurementPlanRepo.getPlans(shop_id, searchKeyword);
};

const updatePlanService = async (id, data) => {
  if (!id) throw new Error("BAD_REQUEST: Thiếu ID kế hoạch.");
  const updatedPlan = await measurementPlanRepo.updatePlan(id, data);
  if (!updatedPlan) throw new Error("NOT_FOUND: Không tìm thấy kế hoạch đo.");
  return updatedPlan;
};

const deletePlanService = async (id) => {
  if (!id) throw new Error("BAD_REQUEST: Thiếu ID kế hoạch.");
  const deletedPlan = await measurementPlanRepo.deletePlan(id);
  if (!deletedPlan) throw new Error("NOT_FOUND: Không tìm thấy kế hoạch đo hoặc đã bị xóa.");
  return deletedPlan;
};

const exportExcelService = async (planId) => {
  const { shopName, details } = await measurementPlanRepo.getPlanDataForExport(planId);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Bang_Do_Thong_So');

  // --- BƯỚC 1: XỬ LÝ SẢN PHẨM ĐỂ TẠO CỘT ĐỘNG ---
  const productNamesSet = new Set();
  details.forEach(item => {
    item.parsedProducts = {};
    if (item.products_data) {
      const pairs = item.products_data.split('||');
      pairs.forEach(pair => {
        const [name, size] = pair.split('::');
        if (name) {
          const cleanName = name.trim();
          item.parsedProducts[cleanName] = filterSize(size);
          productNamesSet.add(cleanName);
        }
      });
    }
  });
  
  const dynamicProducts = Array.from(productNamesSet);
  const numProducts = dynamicProducts.length > 0 ? dynamicProducts.length : 1;
  const displayProducts = dynamicProducts.length > 0 ? dynamicProducts : ['SẢN PHẨM'];

  // Tổng số cột = Cố định (4) + Áo (10) + Quần (6) + Size (N) + Ghi chú (1)
  const totalCols = 4 + 10 + 6 + numProducts + 1;
  const lastColLetter = getColLetter(totalCols); 

  sheet.mergeCells(`A3:${lastColLetter}3`);
  sheet.getCell('A3').value = 'BẢNG ĐO THÔNG SỐ ĐỒNG PHỤC';
  sheet.getCell('A3').alignment = { horizontal: 'center' };
  sheet.getCell('A3').font = { bold: true, size: 16 };

  sheet.mergeCells(`A4:${lastColLetter}4`);
  sheet.getCell('A4').value = 'TÊN ĐƠN VỊ: ' + (shopName || '');
  sheet.getCell('A4').alignment = { horizontal: 'center' };
  sheet.getCell('A4').font = { italic: true, size: 12 };

  // --- BƯỚC 3: TẠO CẤU TRÚC TIÊU ĐỀ BẢNG (DÒNG 9 & 10) ---
  
  // Dòng 9: Thiết lập nhóm ÁO, QUẦN rồi mới tới SIZE
  const row9Values = ['TT', 'HỌ VÀ TÊN', 'GIỚI TÍNH', 'CHỨC VỤ'];
  
  row9Values.push('ÁO');
  for (let i = 1; i < 10; i++) row9Values.push(''); // Trữ 9 ô trống cho ÁO (Tổng 10 ô)
  
  row9Values.push('QUẦN'); 
  for (let i = 1; i < 6; i++) row9Values.push(''); // Trữ 5 ô trống cho QUẦN (Tổng 6 ô)
  
  row9Values.push('SIZE');
  for (let i = 1; i < numProducts; i++) row9Values.push(''); // Trữ ô trống cho SIZE
  
  row9Values.push('GHI CHÚ');
  sheet.getRow(9).values = row9Values;

  // Dòng 10: Chi tiết các cột
  const row10Values = ['', '', '', ''];
  // Nhóm ÁO (10 cột)
  row10Values.push('VAI', 'DÀI TAY', 'DÀI ÁO', 'VÒNG NGỰC', 'VÒNG EO', 'VÒNG MÔNG', 'CỔ', 'BẮP TAY', 'NGANG', 'NÁCH'); 
  // Nhóm QUẦN (6 cột)
  row10Values.push('LƯNG QUẦN', 'DÀI QUẦN', 'ĐÁY', 'ĐÙI', 'ỐNG', 'LY'); 
  // Nhóm SIZE (Tên sản phẩm)
  displayProducts.forEach(prod => row10Values.push(prod)); 
  // Ghi chú
  row10Values.push(''); 
  sheet.getRow(10).values = row10Values;

  // --- MERGE CELLS HEADER ---
  sheet.mergeCells('A9:A10'); // TT
  sheet.mergeCells('B9:B10'); // Họ tên
  sheet.mergeCells('C9:C10'); // Giới tính
  sheet.mergeCells('D9:D10'); // Chức vụ
  
  // Gộp nhóm ÁO (Cột 5 -> 14) tương đương E9:N9
  sheet.mergeCells(`${getColLetter(5)}9:${getColLetter(14)}9`);

  // Gộp nhóm QUẦN (Cột 15 -> 20) tương đương O9:T9
  sheet.mergeCells(`${getColLetter(15)}9:${getColLetter(20)}9`);

  // Gộp nhóm SIZE (Từ cột 21 -> 20 + số sản phẩm)
  const sizeStartCol = getColLetter(21);
  const sizeEndCol = getColLetter(20 + numProducts);
  if (numProducts > 1) sheet.mergeCells(`${sizeStartCol}9:${sizeEndCol}9`);

  // Ghi chú
  const noteCol = getColLetter(totalCols);
  sheet.mergeCells(`${noteCol}9:${noteCol}10`);

  // Styling cho Dòng 9 & 10
  [sheet.getRow(9), sheet.getRow(10)].forEach(row => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
  });

  // --- BƯỚC 4: ĐỔ DỮ LIỆU ---
  details.forEach((item, index) => {
    let genderVN = item.gender === 'male' ? 'Nam' : (item.gender === 'female' ? 'Nữ' : item.gender);

    const rowData = [
      index + 1,
      item.full_name,
      genderVN,
      '', // Chức vụ
      // Đổ số đo ÁO (10 số đo)
      item.m_vai, item.m_dai_tay, item.m_dai_ao, item.m_vong_nguc, 
      item.m_vong_eo, item.m_vong_mong, item.m_co, item.m_bap_tay, 
      item.m_ngang, item.m_nach,
      // Đổ số đo QUẦN (6 số đo)
      item.m_lung_quan, item.m_dai_quan, item.m_day, item.m_dui, 
      item.m_ong, item.m_ly
    ];

    // Đổ Size vào sau
    displayProducts.forEach(prodName => {
      rowData.push(item.parsedProducts[prodName] || '');
    });

    rowData.push(item.note); // Ghi chú chốt lại

    const dataRow = sheet.addRow(rowData);

    // Kẻ viền và căn lề
    dataRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    dataRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' }; // Căn trái Họ Tên
    dataRow.getCell(totalCols).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }; // Ghi chú
  });

  // --- BƯỚC 5: TÙY CHỈNH KÍCH THƯỚC CỘT ---
  sheet.getColumn(1).width = 5;   // TT
  sheet.getColumn(2).width = 25;  // Họ tên
  sheet.getColumn(3).width = 10;  // Giới tính
  sheet.getColumn(4).width = 12;  // Chức vụ
  
  // Cột Thông số đo (16 Cột: Áo & Quần) - Từ cột 5 đến 20
  for (let i = 5; i <= 20; i++) {
    sheet.getColumn(i).width = 9.5; // Tăng một chút để hiển thị đủ các chữ như "VÒNG NGỰC"
  }
  
  // Cột Sản phẩm động (Nằm trong nhóm SIZE) - Từ cột 21 trở đi
  for (let i = 21; i < 21 + numProducts; i++) {
    sheet.getColumn(i).width = 15; 
  }

  // Cột Ghi chú
  sheet.getColumn(totalCols).width = 20;

  return await workbook.xlsx.writeBuffer();
};

module.exports = { createPlanService, getPlansService, updatePlanService, deletePlanService, exportExcelService };