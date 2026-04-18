const ExcelJS = require('exceljs');
const measurementPlanRepo = require('../../repositories/admin/measurementPlan.repo');

class ExcelService {
    async exportMeasurementPlan(planId) {
        const planData = await measurementPlanRepo.getPlanDataForExport(planId);
        const { plan, details } = planData;

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Bảng đo thông số');

        // 1. Set default width
        sheet.columns = [
            { width: 5 },  // TT
            { width: 25 }, // Họ tên
            { width: 10 }, // Giới tính
            { width: 20 }, // Chức vụ
            // Chỉ tiêu nam (4 cols)
            { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 },
            // Chỉ tiêu nữ (5 cols)
            { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 },
            // Áo (10 cols)
            { width: 8 }, { width: 8 }, { width: 8 }, { width: 10 }, { width: 10 }, 
            { width: 10 }, { width: 8 }, { width: 8 }, { width: 8 }, { width: 8 },
            // Quần (6 cols)
            { width: 10 }, { width: 10 }, { width: 8 }, { width: 8 }, { width: 8 }, { width: 8 },
            // Size (6 cols)
            { width: 8 }, { width: 8 }, { width: 8 }, { width: 10 }, { width: 10 }, { width: 10 },
            { width: 20 }, // Ghi chú
            { width: 15 }  // Ký tên
        ];

        // 2. Header Đơn vị (Dòng 1-4)
        sheet.mergeCells('A1:AJ1');
        sheet.getCell('A1').value = 'TỔNG CÔNG TY CP MAY NHÀ BÈ';
        sheet.mergeCells('A2:AJ2');
        sheet.getCell('A2').value = 'CHI NHÁNH PHÍA BẮC TỔNG CÔNG TY MAY NHÀ BÈ - CÔNG TY CỔ PHẦN';
        
        sheet.mergeCells('A3:AJ3');
        const titleCell = sheet.getCell('A3');
        titleCell.value = 'BẢNG ĐO THÔNG SỐ ĐỒNG PHỤC';
        titleCell.font = { bold: true, size: 14 };
        titleCell.alignment = { horizontal: 'center' };

        sheet.getCell('A4').value = 'TÊN ĐƠN VỊ:';
        sheet.mergeCells('D4:L4');
        sheet.getCell('D4').value = plan.shop_name || 'BIDV NAM ĐÀ NẴNG'; // Lấy từ shop_id

        // 3. Tạo Header Bảng (Dòng 9-10)
        const headerRow9 = sheet.getRow(9);
        headerRow9.values = [
            'TT', 'HỌ VÀ TÊN', 'GIỚI TÍNH', 'CHỨC VỤ', 
            'CHỈ TIÊU NAM', '', '', '', 
            'CHỈ TIÊU NỮ', '', '', '', '',
            'ÁO', '', '', '', '', '', '', '', '', '',
            'QUẦN', '', '', '', '', '',
            'SIZE', '', '', '', '', '',
            'GHI CHÚ', 'KÝ XÁC NHẬN'
        ];

        // Merge headers
        sheet.mergeCells('E9:H9'); // Chỉ tiêu nam
        sheet.mergeCells('I9:M9'); // Chỉ tiêu nữ
        sheet.mergeCells('N9:W9'); // Áo
        sheet.mergeCells('X9:AC9'); // Quần
        sheet.mergeCells('AD9:AI9'); // Size

        const headerRow10 = sheet.getRow(10);
        headerRow10.values = [
            '', '', '', '',
            'SƠMI NT', 'SƠMI DT', 'QUẦN ÂU', 'ÁO VEST',
            'ÁO VEST', 'QUẦN ÂU', 'JUYP', 'SƠMI NT', 'SƠMI DT',
            'VAI', 'DÀI TAY', 'DÀI ÁO', 'VÒNG NGỰC', 'VÒNG EO', 'VÒNG MÔNG', 'CỔ', 'BẮP TAY', 'NGANG', 'NÁCH',
            'LƯNG', 'DÀI Q', 'ĐÁY', 'ĐÙI', 'ỐNG', 'LY',
            'VEST', 'QUẦN', 'VÁY', 'SƠ MI NỮ', 'SLIMFIT', 'CLASSIC',
            '', ''
        ];

        // Style headers
        [headerRow9, headerRow10].forEach(row => {
            row.eachCell(cell => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
                cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.font = { bold: true, size: 9 };
            });
        });

        // 4. Đổ dữ liệu khách hàng
        details.forEach((item, index) => {
            const row = sheet.addRow([
                index + 1,
                item.full_name,
                item.gender,
                item.position || '',
                // Quantities (Nam)
                item.q_somi_nt_nam || '', item.q_somi_dt_nam || '', item.q_quan_nam || '', item.q_vest_nam || '',
                // Quantities (Nữ)
                item.q_vest_nu || '', item.q_quan_nu || '', item.q_juyp_nu || '', item.q_somi_nt_nu || '', item.q_somi_dt_nu || '',
                // Áo measurements
                item.m_VAI, item.m_DAI_TAY, item.m_DAI_AO, item.m_VONG_NGUC, item.m_VONG_EO, item.m_VONG_MONG, item.m_CO, item.m_BAP_TAY, item.m_NGANG, item.m_NACH,
                // Quần measurements
                item.m_LUNG_QUAN, item.m_DAI_QUAN, item.m_DAY, item.m_DUI, item.m_ONG, item.m_LY,
                // Sizes
                item.s_VEST, item.s_QUAN, item.s_VAY, item.s_SOMI_NU, item.s_SLIMFIT, item.s_CLASSIC,
                item.note,
                ''
            ]);

            row.eachCell(cell => {
                cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });
        });

        return workbook;
    }
}

module.exports = new ExcelService();