const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const slugify = require('slugify');

// Import tất cả 11 model
const roleModel = require('./schemas/roles');
const userModel = require('./schemas/users');
const categoryModel = require('./schemas/categories');
const productModel = require('./schemas/products');
const inventoryModel = require('./schemas/inventories');
const reviewModel = require('./schemas/reviews');
const cartModel = require('./schemas/carts');
const reservationModel = require('./schemas/reservation');
const messageModel = require('./schemas/messages');
const paymentModel = require('./schemas/payments');
const voucherModel = require('./schemas/vouchers');

const MONGO_URI = 'mongodb+srv://minh_db_user:147258@webthethao.hfvrhoo.mongodb.net/?appName=webthethao';

async function seedData() {
    try {
        console.log("⏳ Đang kết nối tới MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Kết nối thành công!");

        // 1. Xóa toàn bộ dữ liệu cũ của 11 collections
        console.log("⏳ Đang dọn dẹp Database (11 collections)...");
        await Promise.all([
            roleModel.deleteMany({}),
            userModel.deleteMany({}),
            categoryModel.deleteMany({}),
            productModel.deleteMany({}),
            inventoryModel.deleteMany({}),
            reviewModel.deleteMany({}),
            cartModel.deleteMany({}),
            reservationModel.deleteMany({}),
            messageModel.deleteMany({}),
            paymentModel.deleteMany({}),
            voucherModel.deleteMany({})
        ]);
        console.log("✅ Đã xóa dữ liệu cũ của 11 collections!");

        // =============================================
        // 2. TẠO ROLES (5 roles)
        // =============================================
        console.log("\n⏳ [1/11] Đang tạo Roles...");
        const roles = await roleModel.insertMany([
            { name: 'ADMIN', description: 'Quản trị viên toàn quyền hệ thống' },
            { name: 'USER', description: 'Khách hàng mua sắm' },
            { name: 'STAFF', description: 'Nhân viên quản lý kho và đơn hàng' },
            { name: 'MANAGER', description: 'Quản lý chi nhánh' },
            { name: 'GUEST', description: 'Khách vãng lai, chỉ xem' }
        ]);
        const adminRole = roles[0]; // ADMIN
        const userRole  = roles[1]; // USER
        const staffRole = roles[2]; // STAFF
        console.log(`✅ Đã tạo ${roles.length} roles: ${roles.map(r => r.name).join(', ')}`);

        // =============================================
        // 3. TẠO USERS (5 users)
        // =============================================
        console.log("\n⏳ [2/11] Đang tạo Users...");
        const usersData = [
            {
                username: 'admin',
                password: 'Admin@123',
                email: 'admin@sportshop.com',
                fullName: 'Nguyễn Quản Trị',
                role: adminRole._id,
                status: true,
                avatarUrl: 'https://i.pravatar.cc/150?img=1'
            },
            {
                username: 'minh_user',
                password: 'User@123',
                email: 'nhatminh@gmail.com',
                fullName: 'Nguyễn Nhật Minh',
                role: userRole._id,
                status: true,
                avatarUrl: 'https://i.pravatar.cc/150?img=2'
            },
            {
                username: 'hoang_staff',
                password: 'Staff@123',
                email: 'hoang@sportshop.com',
                fullName: 'Lê Huy Hoàng',
                role: staffRole._id,
                status: true,
                avatarUrl: 'https://i.pravatar.cc/150?img=3'
            },
            {
                username: 'lan_anh',
                password: 'User@123',
                email: 'lananh@gmail.com',
                fullName: 'Trần Lan Anh',
                role: userRole._id,
                status: false, // Tài khoản bị khoá
                avatarUrl: 'https://i.pravatar.cc/150?img=5'
            },
            {
                username: 'test_acc',
                password: 'User@123',
                email: 'test@gmail.com',
                fullName: 'Tài Khoản Test',
                role: userRole._id,
                status: true,
                avatarUrl: 'https://i.pravatar.cc/150?img=6'
            }
        ];
        // Dùng create() để trigger mongoose pre-save hook (auto hash password)
        const createdUsers = [];
        for (let u of usersData) {
            const newUser = await userModel.create(u);
            createdUsers.push(newUser);
        }
        console.log(`✅ Đã tạo ${createdUsers.length} users`);

        // =============================================
        // 4. TẠO CATEGORIES (5 danh mục)
        // =============================================
        console.log("\n⏳ [3/11] Đang tạo Categories...");
        const categoriesData = [
            { name: 'Áo Bóng Đá',        image: 'https://placehold.co/400x300?text=Ao+Bong+Da' },
            { name: 'Giày Thể Thao',      image: 'https://placehold.co/400x300?text=Giay+The+Thao' },
            { name: 'Dụng Cụ Tập Gym',    image: 'https://placehold.co/400x300?text=Dung+Cu+Gym' },
            { name: 'Phụ Kiện Thể Thao',  image: 'https://placehold.co/400x300?text=Phu+Kien' },
            { name: 'Quần Shorts',         image: 'https://placehold.co/400x300?text=Quan+Shorts' }
        ];
        const categories = [];
        for (let cat of categoriesData) {
            const newCat = await categoryModel.create({
                name: cat.name,
                slug: slugify(cat.name, { lower: true, locale: 'vi' }),
                image: cat.image
            });
            categories.push(newCat);
        }
        console.log(`✅ Đã tạo ${categories.length} categories`);

        // =============================================
        // 5. TẠO PRODUCTS + INVENTORIES (7 sản phẩm)
        // =============================================
        console.log("\n⏳ [4/11 & 5/11] Đang tạo Products và Inventories...");
        const productsRaw = [
            {
                sku: 'AOBD-MU-2024',
                title: 'Áo MU Sân Nhà 2024',
                price: 350000,
                description: 'Áo đấu chính hãng Manchester United sân nhà mùa giải 2024. Chất liệu Dri-FIT thoáng khí, thấm mồ hôi tốt. Phù hợp cả thi đấu lẫn thời trang.',
                catIdx: 0,
                stock: 100,
                soldCount: 45,
                images: [
                    'https://placehold.co/600x400/dc143c/white?text=Ao+MU+2024',
                    'https://placehold.co/600x400/dc143c/white?text=MU+Back'
                ]
            },
            {
                sku: 'AOBD-MC-2024',
                title: 'Áo Man City Sân Khách 2024',
                price: 320000,
                description: 'Áo đấu Man City sân khách màu trắng mùa 2024. Thiết kế hiện đại, logo thêu sắc nét. Chất liệu nhẹ, co giãn tốt.',
                catIdx: 0,
                stock: 80,
                soldCount: 38,
                images: [
                    'https://placehold.co/600x400/87ceeb/333?text=Ao+Man+City',
                    'https://placehold.co/600x400/87ceeb/333?text=MC+Away'
                ]
            },
            {
                sku: 'GIAY-NIKE-PEG40',
                title: 'Giày Nike Pegasus 40',
                price: 2800000,
                description: 'Giày chạy bộ Nike Pegasus 40 với đệm Air Zoom cho cảm giác nhẹ bước. Đế ngoài cao su bền bỉ, phù hợp chạy đường dài. Size từ 38-46.',
                catIdx: 1,
                stock: 25,
                soldCount: 12,
                images: [
                    'https://placehold.co/600x400/ff6600/white?text=Nike+Peg+40',
                    'https://placehold.co/600x400/ff6600/white?text=Nike+Side'
                ]
            },
            {
                sku: 'GIAY-ADIDAS-UB22',
                title: 'Giày Adidas Ultraboost 22',
                price: 3200000,
                description: 'Giày Adidas Ultraboost 22 với công nghệ đệm BOOST vượt trội. Phần upper Primeknit ôm sát bàn chân. Lý tưởng cho chạy marathon và gym.',
                catIdx: 1,
                stock: 15,
                soldCount: 8,
                images: [
                    'https://placehold.co/600x400/000000/white?text=Adidas+UB22',
                    'https://placehold.co/600x400/000000/white?text=Adidas+Top'
                ]
            },
            {
                sku: 'GYM-TA-CAO-SU-5KG',
                title: 'Tạ Tay Cao Su 5kg',
                price: 150000,
                description: 'Tạ tay bọc cao su 5kg không mùi, không trầy sàn. Bề mặt nhám chống trơn trượt. Phù hợp tập tại nhà, gym, yoga. Bán theo cặp.',
                catIdx: 2,
                stock: 200,
                soldCount: 87,
                images: [
                    'https://placehold.co/600x400/2d2d2d/white?text=Ta+Tay+5kg',
                    'https://placehold.co/600x400/2d2d2d/white?text=Ta+Pair'
                ]
            },
            {
                sku: 'PK-TAT-CHONG-TRUOT',
                title: 'Tất Thể Thao Chống Trượt Nike',
                price: 45000,
                description: 'Tất thể thao Nike chống trượt, kháng khuẩn. Chất liệu cotton + spandex co giãn 4 chiều. Thiết kế ôm chân, phù hợp mọi môn thể thao.',
                catIdx: 3,
                stock: 500,
                soldCount: 210,
                images: [
                    'https://placehold.co/600x400/ffffff/333?text=Tat+Nike',
                    'https://placehold.co/600x400/ffffff/333?text=Tat+Pair'
                ]
            },
            {
                sku: 'QS-PUMA-RUNNING',
                title: 'Quần Shorts Puma Running',
                price: 250000,
                description: 'Quần shorts Puma chuyên chạy bộ. Chất liệu polyester nhẹ thoáng. Có túi khoá tiện lợi, dây rút điều chỉnh eo. Nhiều màu sắc.',
                catIdx: 4,
                stock: 60,
                soldCount: 22,
                images: [
                    'https://placehold.co/600x400/333399/white?text=Quan+Puma',
                    'https://placehold.co/600x400/333399/white?text=Puma+Running'
                ]
            }
        ];

        const createdProducts = [];
        const createdInventories = [];

        for (let p of productsRaw) {
            // Tạo product
            const newProd = await productModel.create({
                sku: p.sku,
                title: p.title,
                slug: slugify(p.title, { lower: true, locale: 'vi' }),
                price: p.price,
                description: p.description,
                images: p.images,
                category: categories[p.catIdx]._id
            });

            // Tạo inventory tương ứng
            const newInv = await inventoryModel.create({
                product: newProd._id,
                stock: p.stock,
                reserved: 0,
                soldCount: p.soldCount
            });

            createdProducts.push(newProd);
            createdInventories.push(newInv);
        }
        console.log(`✅ Đã tạo ${createdProducts.length} products`);
        console.log(`✅ Đã tạo ${createdInventories.length} inventories`);

        // =============================================
        // 6. TẠO REVIEWS (6 đánh giá)
        // =============================================
        console.log("\n⏳ [6/11] Đang tạo Reviews...");
        const reviewsData = [
            {
                user: createdUsers[1]._id,       // minh_user
                product: createdProducts[0]._id,  // Áo MU
                rating: 5,
                comment: 'Áo đẹp lắm! Chất vải mềm mịn, mặc thoáng mát. Giao hàng nhanh, đóng gói cẩn thận. Sẽ mua thêm!'
            },
            {
                user: createdUsers[3]._id,        // lan_anh
                product: createdProducts[2]._id,  // Giày Nike
                rating: 4,
                comment: 'Giày chính hãng, đế êm, chạy bộ rất thoải mái. Trừ 1 sao vì size hơi rộng hơn bình thường, nên order nhỏ hơn 1 size.'
            },
            {
                user: createdUsers[4]._id,        // test_acc
                product: createdProducts[4]._id,  // Tạ tay
                rating: 5,
                comment: 'Tạ cao su xịn, không mùi, không trầy sàn. Mua 2 cái 5kg tập tại nhà rất tiện. Giá hợp lý!'
            },
            {
                user: createdUsers[1]._id,        // minh_user
                product: createdProducts[3]._id,  // Giày Adidas
                rating: 3,
                comment: 'Giày đẹp nhưng giá hơi cao. Đế giày tốt, chạy nhẹ chân. Phần cổ giày hơi cứng, cần thời gian để mềm.'
            },
            {
                user: createdUsers[2]._id,        // hoang_staff
                product: createdProducts[1]._id,  // Áo Man City
                rating: 5,
                comment: 'Áo Man City đẹp xuất sắc! Logo thêu sắc nét, chất vải cao cấp. Mua tặng bạn bè ai cũng khen!'
            },
            {
                user: createdUsers[4]._id,        // test_acc
                product: createdProducts[6]._id,  // Quần Shorts Puma
                rating: 4,
                comment: 'Quần mặc nhẹ thoáng, chạy bộ rất ổn. Túi khoá tiện, không lo rớt điện thoại. Nhưng ống quần hơi ngắn.'
            }
        ];
        await reviewModel.insertMany(reviewsData);
        console.log(`✅ Đã tạo ${reviewsData.length} reviews`);

        // =============================================
        // 7. TẠO CARTS (3 giỏ hàng cho users đã đăng ký)
        // =============================================
        console.log("\n⏳ [7/11] Đang tạo Carts...");
        const cartsData = [
            {
                // Cart của admin (trống)
                user: createdUsers[0]._id,
                products: []
            },
            {
                // Cart của minh_user (có 2 sản phẩm)
                user: createdUsers[1]._id,
                products: [
                    { product: createdProducts[0]._id, quantity: 2 }, // 2 áo MU
                    { product: createdProducts[5]._id, quantity: 3 }  // 3 đôi tất
                ]
            },
            {
                // Cart của hoang_staff (có 1 sản phẩm)
                user: createdUsers[2]._id,
                products: [
                    { product: createdProducts[4]._id, quantity: 1 } // 1 tạ tay
                ]
            },
            {
                // Cart của lan_anh (trống)
                user: createdUsers[3]._id,
                products: []
            },
            {
                // Cart của test_acc (có hàng)
                user: createdUsers[4]._id,
                products: [
                    { product: createdProducts[6]._id, quantity: 1 }, // 1 quần shorts
                    { product: createdProducts[2]._id, quantity: 1 }  // 1 giày Nike
                ]
            }
        ];
        const createdCarts = await cartModel.insertMany(cartsData);
        console.log(`✅ Đã tạo ${createdCarts.length} carts`);

        // =============================================
        // 8. TẠO RESERVATIONS (3 đơn hàng)
        // =============================================
        console.log("\n⏳ [8/11] Đang tạo Reservations (Đơn hàng)...");
        const reservationsData = [
            {
                user: createdUsers[1]._id, // minh_user
                products: [
                    {
                        product: createdProducts[0]._id,
                        title: 'Áo MU Sân Nhà 2024',
                        quantity: 1,
                        price: 350000
                    },
                    {
                        product: createdProducts[5]._id,
                        title: 'Tất Thể Thao Chống Trượt Nike',
                        quantity: 2,
                        price: 45000
                    }
                ],
                status: 'completed',
                totalAmount: 350000 + (45000 * 2), // = 440000
                shippingAddress: '123 Nguyễn Huệ, Quận 1, TP.HCM',
                paymentMethod: 'COD'
            },
            {
                user: createdUsers[4]._id, // test_acc
                products: [
                    {
                        product: createdProducts[2]._id,
                        title: 'Giày Nike Pegasus 40',
                        quantity: 1,
                        price: 2800000
                    }
                ],
                status: 'pending',
                totalAmount: 2800000,
                shippingAddress: '456 Lê Lợi, Quận 3, TP.HCM',
                paymentMethod: 'ZALO_PAY'
            },
            {
                user: createdUsers[1]._id, // minh_user - đơn thứ 2
                products: [
                    {
                        product: createdProducts[4]._id,
                        title: 'Tạ Tay Cao Su 5kg',
                        quantity: 2,
                        price: 150000
                    },
                    {
                        product: createdProducts[6]._id,
                        title: 'Quần Shorts Puma Running',
                        quantity: 1,
                        price: 250000
                    }
                ],
                status: 'actived',
                totalAmount: (150000 * 2) + 250000, // = 550000
                shippingAddress: '789 Trần Hưng Đạo, Quận 5, TP.HCM',
                paymentMethod: 'ATM'
            }
        ];
        const createdReservations = await reservationModel.insertMany(reservationsData);
        console.log(`✅ Đã tạo ${createdReservations.length} reservations (đơn hàng)`);

        // =============================================
        // 9. TẠO PAYMENTS (2 thanh toán)
        // =============================================
        console.log("\n⏳ [9/11] Đang tạo Payments...");
        const paymentsData = [
            {
                reservation: createdReservations[0]._id, // Đơn hàng completed
                user: createdUsers[1]._id,
                method: 'COD',
                amount: 440000,
                status: 'paid',
                paidAt: new Date('2024-12-15T10:30:00'),
                transactionID: 'COD-20241215-001'
            },
            {
                reservation: createdReservations[1]._id, // Đơn hàng pending
                user: createdUsers[4]._id,
                method: 'ZALO_PAY',
                amount: 2800000,
                status: 'pending',
                transactionID: 'ZALO-20241216-001',
                providerResponse: JSON.stringify({ code: 1, message: 'pending' })
            }
        ];
        const createdPayments = await paymentModel.insertMany(paymentsData);
        console.log(`✅ Đã tạo ${createdPayments.length} payments`);

        // =============================================
        // 10. TẠO MESSAGES (4 tin nhắn)
        // =============================================
        console.log("\n⏳ [10/11] Đang tạo Messages...");
        const messagesData = [
            {
                from: createdUsers[1]._id, // minh_user -> admin
                to: createdUsers[0]._id,
                messageContent: { type: 'text', text: 'Chào shop! Cho mình hỏi áo MU size L còn hàng không ạ?' }
            },
            {
                from: createdUsers[0]._id, // admin -> minh_user
                to: createdUsers[1]._id,
                messageContent: { type: 'text', text: 'Chào bạn! Áo MU size L hiện vẫn còn khoảng 20 cái. Bạn muốn đặt hàng không?' }
            },
            {
                from: createdUsers[1]._id, // minh_user -> admin
                to: createdUsers[0]._id,
                messageContent: { type: 'text', text: 'Cảm ơn shop! Mình đặt 2 cái nhé. Ship đến Q1 bao lâu vậy?' }
            },
            {
                from: createdUsers[4]._id, // test_acc -> admin
                to: createdUsers[0]._id,
                messageContent: { type: 'text', text: 'Shop ơi, giày Nike size 42 còn không? Mình cần gấp.' }
            }
        ];
        const createdMessages = await messageModel.insertMany(messagesData);
        console.log(`✅ Đã tạo ${createdMessages.length} messages`);

        // =============================================
        // 11. TẠO VOUCHERS (3 mã giảm giá)
        // =============================================
        console.log("\n⏳ [11/11] Đang tạo Vouchers...");
        const now = new Date();
        const vouchersData = [
            {
                code: 'WELCOME50K',
                discountValue: 50000,
                minOrderValue: 200000,
                expirationDate: new Date(now.getTime() + 30 * 24 * 3600 * 1000), // +30 ngày
                isActive: true
            },
            {
                code: 'SALE20PERCENT',
                discountValue: 100000,
                minOrderValue: 500000,
                expirationDate: new Date(now.getTime() + 7 * 24 * 3600 * 1000), // +7 ngày
                isActive: true
            },
            {
                code: 'FREESHIP2024',
                discountValue: 30000,
                minOrderValue: 0,
                expirationDate: new Date(now.getTime() - 24 * 3600 * 1000), // Đã hết hạn
                isActive: false
            }
        ];
        const createdVouchers = await voucherModel.insertMany(vouchersData);
        console.log(`✅ Đã tạo ${createdVouchers.length} vouchers`);

        // =============================================
        // TỔNG KẾT
        // =============================================
        console.log("\n╔═══════════════════════════════════════════════╗");
        console.log("║       🎉 SEED DATA THÀNH CÔNG - 11 MODELS! 🎉      ║");
        console.log("╠═══════════════════════════════════════════════╣");
        console.log(`║  1. Roles:        ${roles.length} records                         ║`);
        console.log(`║  2. Users:        ${createdUsers.length} records                         ║`);
        console.log(`║  3. Categories:   ${categories.length} records                         ║`);
        console.log(`║  4. Products:     ${createdProducts.length} records                         ║`);
        console.log(`║  5. Inventories:  ${createdInventories.length} records                         ║`);
        console.log(`║  6. Reviews:      ${reviewsData.length} records                         ║`);
        console.log(`║  7. Carts:        ${createdCarts.length} records                         ║`);
        console.log(`║  8. Reservations: ${createdReservations.length} records                         ║`);
        console.log(`║  9. Payments:     ${createdPayments.length} records                         ║`);
        console.log(`║  10. Messages:    ${createdMessages.length} records                         ║`);
        console.log(`║  11. Vouchers:    ${createdVouchers.length} records                         ║`);
        console.log("╠═══════════════════════════════════════════════╣");
        console.log("║  🔑 TÀI KHOẢN TEST:                               ║");
        console.log("║  👑 Admin:  admin / Admin@123                       ║");
        console.log("║  👤 User:   minh_user / User@123                   ║");
        console.log("║  🛠️  Staff:  hoang_staff / Staff@123               ║");
        console.log("╠═══════════════════════════════════════════════╣");
        console.log("║  🎟️  VOUCHER CODES:                                ║");
        console.log("║  WELCOME50K  - Giảm 50k (đơn từ 200k)             ║");
        console.log("║  SALE20PERCENT - Giảm 100k (đơn từ 500k)          ║");
        console.log("╚═══════════════════════════════════════════════╝\n");

        process.exit(0);

    } catch (error) {
        console.error("❌ LỖI SEED DATA:", error);
        process.exit(1);
    }
}

seedData();