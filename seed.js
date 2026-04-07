const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const slugify = require('slugify');

// Import các model
const roleModel = require('./schemas/roles');
const userModel = require('./schemas/users');
const categoryModel = require('./schemas/categories');
const productModel = require('./schemas/products');
const inventoryModel = require('./schemas/inventories');

const MONGO_URI = 'mongodb+srv://minh_db_user:147258@webthethao.hfvrhoo.mongodb.net/?appName=webthethao';

async function seedData() {
    try {
        console.log("⏳ Đang kết nối tới MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Kết nối thành công!");

        // 1. Xóa dữ liệu cũ
        console.log("⏳ Đang dọn dẹp Database...");
        await Promise.all([
            roleModel.deleteMany({}),
            userModel.deleteMany({}),
            categoryModel.deleteMany({}),
            productModel.deleteMany({}),
            inventoryModel.deleteMany({})
        ]);

        // 2. Tạo 5 Roles (Yêu cầu 3)
        console.log("⏳ Đang tạo Roles...");
        const roles = await roleModel.insertMany([
            { name: 'ADMIN', description: 'Quản trị viên toàn quyền hệ thống' },
            { name: 'USER', description: 'Khách hàng mua sắm' },
            { name: 'STAFF', description: 'Nhân viên quản lý kho và đơn hàng' },
            { name: 'MANAGER', description: 'Quản lý chi nhánh' },
            { name: 'GUEST', description: 'Khách vãng lai' }
        ]);
        const adminRole = roles[0];
        const userRole = roles[1];

        // 3. Tạo 5 Users mẫu (Yêu cầu 4)
        console.log("⏳ Đang tạo Users...");
        const usersData = [
            { username: 'admin', password: 'Admin@123', email: 'admin@sportshop.com', fullName: 'Nguyễn Quản Trị', role: adminRole._id, status: true },
            { username: 'minh_user', password: 'User@123', email: 'nhatminh@gmail.com', fullName: 'Nhật Minh', role: userRole._id, status: true },
            { username: 'hoang_staff', password: 'Staff@123', email: 'hoang@sportshop.com', fullName: 'Lê Huy Hoàng', role: roles[2]._id, status: true },
            { username: 'lan_anh', password: 'User@123', email: 'lananh@gmail.com', fullName: 'Trần Lan Anh', role: userRole._id, status: false }, // User đang bị khóa
            { username: 'test_acc', password: 'User@123', email: 'test@gmail.com', fullName: 'Tài Khoản Test', role: userRole._id, status: true }
        ];
        await userModel.create(usersData);

        // 4. Tạo 5 Danh mục (Categories)
        console.log("⏳ Đang tạo Danh mục...");
        const categoriesData = [
            { name: 'Áo Bóng Đá' },
            { name: 'Giày Thể Thao' },
            { name: 'Dụng Cụ Tập Gym' },
            { name: 'Phụ Kiện Thể Thao' },
            { name: 'Quần Shorts' }
        ];
        const categories = [];
        for (let cat of categoriesData) {
            const newCat = await categoryModel.create({
                name: cat.name,
                slug: slugify(cat.name, { lower: true })
            });
            categories.push(newCat);
        }

        // 5. Tạo 5+ Sản phẩm & Tồn kho tương ứng (Yêu cầu 1, 6)
        console.log("⏳ Đang tạo Sản phẩm và Tồn kho...");
        const productsData = [
            { sku: 'AOBD-MU', title: 'Áo MU Sân Nhà 2024', price: 350000, catIdx: 0, stock: 100 },
            { sku: 'AOBD-MC', title: 'Áo Man City Sân Khách', price: 320000, catIdx: 0, stock: 80 },
            { sku: 'GIAY-NIKE', title: 'Giày Nike Pegasus 40', price: 2800000, catIdx: 1, stock: 25 },
            { sku: 'GIAY-ADIDAS', title: 'Giày Adidas Ultraboost', price: 3200000, catIdx: 1, stock: 15 },
            { sku: 'GYM-DB', title: 'Tạ Tay Cao Su 5kg', price: 150000, catIdx: 2, stock: 200 },
            { sku: 'PK-TAT', title: 'Tất Thể Thao Chống Trượt', price: 45000, catIdx: 3, stock: 500 },
            { sku: 'QS-PUMA', title: 'Quần Shorts Puma Running', price: 250000, catIdx: 4, stock: 60 }
        ];

        for (let p of productsData) {
            const newProd = await productModel.create({
                sku: p.sku,
                title: p.title,
                slug: slugify(p.title, { lower: true }),
                price: p.price,
                description: `Mô tả chi tiết cho ${p.title}. Chất liệu cao cấp, phù hợp hoạt động mạnh.`,
                images: [`https://placehold.co/600x400?text=${encodeURIComponent(p.title)}`],
                category: categories[p.catIdx]._id
            });

            await inventoryModel.create({
                product: newProd._id,
                stock: p.stock,
                reserved: 0,
                soldCount: Math.floor(Math.random() * 20) // Random số lượng đã bán để demo
            });
        }

        console.log("\n-----------------------------------------");
        console.log("🎉 TẠO DỮ LIỆU MẪU THÀNH CÔNG!");
        console.log("👉 Admin: admin / Admin@123");
        console.log("👉 User: minh_user / User@123");
        console.log("-----------------------------------------\n");
        process.exit(0);

    } catch (error) {
        console.error("❌ LỖI SEED DATA:", error);
        process.exit(1);
    }
}

seedData();