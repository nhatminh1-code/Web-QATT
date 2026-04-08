import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BrowserRouter, Routes, Route, Link,
    useNavigate, useParams
} from 'react-router-dom';

const API_URL = 'http://localhost:3000/api/v1';

// =================== CẤU HÌNH AXIOS ===================
// Interceptor tự động gắn token vào mọi request
axios.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// =================== APP CHÍNH ===================
export default function App() {
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        if (token) {
            axios.get(`${API_URL}/auth/me`)
                .then(res => setCurrentUser(res.data))
                .catch(() => {
                    setToken('');
                    localStorage.removeItem('token');
                });
        }
    }, [token]);

    const logout = () => {
        setToken('');
        setCurrentUser(null);
        localStorage.removeItem('token');
        window.location.href = '/';
    };

    return (
        <BrowserRouter>
            <div style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
                {/* NAVBAR */}
                <nav style={{
                    display: 'flex', gap: '15px', padding: '12px 20px',
                    background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                    color: 'white', marginBottom: '20px', alignItems: 'center',
                    flexWrap: 'wrap', borderRadius: '0 0 10px 10px'
                }}>
                    <Link to="/" style={{ color: '#ffd700', textDecoration: 'none', fontWeight: 'bold', fontSize: '20px' }}>
                        ⚽ SPORT SHOP
                    </Link>
                    <Link to="/categories" style={{ color: '#ccc', textDecoration: 'none', fontSize: '14px' }}>📂 Danh mục</Link>
                    <div style={{ flex: 1 }}></div>

                    {!token ? (
                        <Link to="/auth" style={{
                            color: 'white', textDecoration: 'none',
                            background: '#007BFF', padding: '6px 14px', borderRadius: '20px', fontSize: '14px'
                        }}>
                            🔑 Đăng nhập / Đăng ký
                        </Link>
                    ) : (
                        <>
                            {currentUser && (
                                <span style={{ color: '#ffd700', fontSize: '14px' }}>
                                    👤 {currentUser.fullName || currentUser.username}
                                    {currentUser.role?.name === 'ADMIN' && (
                                        <span style={{ background: '#dc3545', padding: '2px 6px', borderRadius: '8px', fontSize: '11px', marginLeft: '5px' }}>ADMIN</span>
                                    )}
                                </span>
                            )}
                            <Link to="/cart" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>🛒 Giỏ hàng</Link>
                            <Link to="/orders" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>📦 Đơn hàng</Link>
                            <Link to="/messages" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>💬 Tin nhắn</Link>
                            <Link to="/vouchers" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>🎟️ Voucher</Link>
                            {currentUser?.role?.name === 'ADMIN' && (
                                <Link to="/dashboard" style={{ color: '#ffd700', textDecoration: 'none', fontSize: '14px' }}>⚙️ Dashboard</Link>
                            )}
                            <button onClick={logout} style={{
                                background: '#dc3545', color: 'white', border: 'none',
                                cursor: 'pointer', padding: '6px 12px', borderRadius: '15px', fontSize: '13px'
                            }}>
                                🚪 Đăng xuất
                            </button>
                        </>
                    )}
                </nav>

                {/* ROUTES */}
                <Routes>
                    <Route path="/" element={<Home token={token} />} />
                    <Route path="/auth" element={<Auth setToken={setToken} />} />
                    <Route path="/categories" element={<CategoriesPage />} />
                    <Route path="/category/:id" element={<CategoryProducts />} />
                    <Route path="/product/:id" element={<ProductDetail token={token} />} />
                    <Route path="/cart" element={<Cart token={token} />} />
                    <Route path="/orders" element={<Orders token={token} />} />
                    <Route path="/messages" element={<Messages token={token} currentUser={currentUser} />} />
                    <Route path="/vouchers" element={<Vouchers />} />
                    <Route path="/dashboard" element={<Dashboard token={token} currentUser={currentUser} />} />
                    <Route path="/inventory" element={<Inventory token={token} />} />
                    <Route path="/roles" element={<Roles token={token} />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

// =================== STYLES DÙNG CHUNG ===================
const cardStyle = {
    border: '1px solid #e0e0e0', padding: '15px',
    borderRadius: '10px', background: 'white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'transform 0.2s, box-shadow 0.2s'
};
const btnStyle = (color = '#007BFF') => ({
    padding: '8px 16px', background: color, color: 'white',
    border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px'
});
const sectionTitle = { fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#1a1a2e' };

// =================== 1. TRANG CHỦ - HIỂN THỊ SẢN PHẨM ===================
function Home({ token }) {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, [search, minPrice, maxPrice]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            let url = `${API_URL}/products?title=${search}`;
            if (minPrice) url += `&minprice=${minPrice}`;
            if (maxPrice) url += `&maxprice=${maxPrice}`;
            const res = await axios.get(url);
            setProducts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '0 10px' }}>
            <h2 style={sectionTitle}>🏆 Sản Phẩm Thể Thao</h2>

            {/* Bộ lọc */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                    placeholder="🔍 Tìm sản phẩm..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', width: '250px' }}
                />
                <input
                    type="number" placeholder="Giá từ (VNĐ)"
                    value={minPrice} onChange={e => setMinPrice(e.target.value)}
                    style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', width: '150px' }}
                />
                <input
                    type="number" placeholder="Giá đến (VNĐ)"
                    value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                    style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', width: '150px' }}
                />
                <button onClick={() => { setSearch(''); setMinPrice(''); setMaxPrice(''); }}
                    style={btnStyle('#6c757d')}>
                    🔄 Reset
                </button>
                <span style={{ color: '#666', fontSize: '14px' }}>
                    {loading ? '⏳ Đang tải...' : `Tìm thấy ${products.length} sản phẩm`}
                </span>
            </div>

            {/* Grid sản phẩm */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>⏳ Đang tải sản phẩm...</div>
            ) : products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
                    <div style={{ fontSize: '60px' }}>🔍</div>
                    <p>Không tìm thấy sản phẩm nào</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                    {products.map(p => (
                        <div key={p._id} style={{ ...cardStyle, cursor: 'pointer' }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                            }}
                        >
                            <img
                                src={p.images?.[0] || 'https://placehold.co/300x200'}
                                alt={p.title}
                                style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '6px', marginBottom: '10px' }}
                                onError={e => e.target.src = 'https://placehold.co/300x200?text=No+Image'}
                            />
                            {p.category && (
                                <span style={{
                                    background: '#e3f2fd', color: '#1976d2', fontSize: '11px',
                                    padding: '2px 8px', borderRadius: '10px', marginBottom: '6px', display: 'inline-block'
                                }}>
                                    {p.category.name}
                                </span>
                            )}
                            <h4 style={{ margin: '6px 0', fontSize: '15px', color: '#1a1a2e', lineHeight: '1.4' }}>{p.title}</h4>
                            <p style={{ color: '#e53935', fontWeight: 'bold', fontSize: '17px', margin: '8px 0' }}>
                                {p.price?.toLocaleString('vi-VN')} VNĐ
                            </p>
                            <Link to={`/product/${p._id}`} style={{ textDecoration: 'none', display: 'block' }}>
                                <button style={{ ...btnStyle('#007BFF'), width: '100%' }}>
                                    👁️ Xem chi tiết
                                </button>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// =================== 2. DANH MỤC (CATEGORIES) ===================
function CategoriesPage() {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        axios.get(`${API_URL}/categories`).then(res => setCategories(res.data));
    }, []);

    return (
        <div style={{ padding: '0 10px' }}>
            <h2 style={sectionTitle}>📂 Danh Mục Sản Phẩm</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                {categories.map(cat => (
                    <Link key={cat._id} to={`/category/${cat._id}`} style={{ textDecoration: 'none' }}>
                        <div style={{ ...cardStyle, textAlign: 'center', cursor: 'pointer' }}>
                            <img
                                src={cat.image || 'https://placehold.co/300x200'}
                                alt={cat.name}
                                style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', marginBottom: '10px' }}
                                onError={e => e.target.src = 'https://placehold.co/300x200'}
                            />
                            <h3 style={{ color: '#1a1a2e', fontSize: '16px', margin: '0' }}>{cat.name}</h3>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

// =================== 2B. SẢN PHẨM THEO DANH MỤC ===================
function CategoryProducts() {
    const { id } = useParams();
    const [products, setProducts] = useState([]);
    const [category, setCategory] = useState(null);

    useEffect(() => {
        axios.get(`${API_URL}/categories/${id}`).then(res => setCategory(res.data));
        axios.get(`${API_URL}/products`).then(res => {
            const filtered = res.data.filter(p => p.category?._id === id || p.category === id);
            setProducts(filtered);
        });
    }, [id]);

    return (
        <div style={{ padding: '0 10px' }}>
            <h2 style={sectionTitle}>📂 {category?.name || 'Danh mục'}</h2>
            {products.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>Không có sản phẩm trong danh mục này.</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                    {products.map(p => (
                        <div key={p._id} style={cardStyle}>
                            <img src={p.images?.[0]} alt={p.title}
                                style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '6px' }} />
                            <h4 style={{ margin: '10px 0 5px', fontSize: '14px' }}>{p.title}</h4>
                            <p style={{ color: '#e53935', fontWeight: 'bold' }}>{p.price?.toLocaleString('vi-VN')} VNĐ</p>
                            <Link to={`/product/${p._id}`}>
                                <button style={{ ...btnStyle(), width: '100%', fontSize: '13px', padding: '6px' }}>Xem chi tiết</button>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// =================== 3. CHI TIẾT SẢN PHẨM + REVIEWS ===================
function ProductDetail({ token }) {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [inventory, setInventory] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [comment, setComment] = useState('');
    const [rating, setRating] = useState(5);
    const [activeImg, setActiveImg] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            axios.get(`${API_URL}/products/${id}`),
            axios.get(`${API_URL}/inventories`)
        ]).then(([prodRes, invRes]) => {
            setProduct(prodRes.data);
            const inv = invRes.data.find(i => i.product?._id === id || i.product === id);
            setInventory(inv);
            setLoading(false);
        }).catch(() => setLoading(false));
        fetchReviews();
    }, [id]);

    const fetchReviews = () => {
        axios.get(`${API_URL}/reviews/product/${id}`)
            .then(res => setReviews(res.data))
            .catch(() => {});
    };

    const addToCart = async () => {
        if (!token) return alert('⚠️ Vui lòng đăng nhập để thêm vào giỏ hàng!');
        try {
            await axios.post(`${API_URL}/carts/add`, { product: id });
            alert('✅ Đã thêm vào giỏ hàng!');
        } catch (err) {
            alert('❌ Lỗi: ' + (err.response?.data?.message || err.message));
        }
    };

    const submitReview = async (e) => {
        e.preventDefault();
        if (!token) return alert('⚠️ Vui lòng đăng nhập để đánh giá!');
        try {
            await axios.post(`${API_URL}/reviews`, { product: id, rating: Number(rating), comment });
            setComment('');
            setRating(5);
            fetchReviews();
            alert('✅ Đã gửi đánh giá!');
        } catch (err) {
            alert('❌ Lỗi: ' + (err.response?.data?.message || err.message));
        }
    };

    const avgRating = reviews.length > 0
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    const renderStars = (n) => '⭐'.repeat(Math.round(n));

    if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}>⏳ Đang tải...</div>;
    if (!product) return <div style={{ textAlign: 'center', padding: '60px', color: 'red' }}>❌ Không tìm thấy sản phẩm!</div>;

    return (
        <div style={{ padding: '0 10px' }}>
            <Link to="/" style={{ color: '#007BFF', textDecoration: 'none', fontSize: '14px' }}>← Về trang chủ</Link>

            <div style={{ display: 'flex', gap: '40px', marginTop: '20px', flexWrap: 'wrap' }}>
                {/* Ảnh sản phẩm */}
                <div style={{ flex: '0 0 420px' }}>
                    <img
                        src={product.images?.[activeImg] || 'https://placehold.co/600x400'}
                        alt={product.title}
                        style={{ width: '100%', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.15)' }}
                        onError={e => e.target.src = 'https://placehold.co/600x400?text=No+Image'}
                    />
                    {/* Thumbnails */}
                    {product.images?.length > 1 && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                            {product.images.map((img, idx) => (
                                <img key={idx} src={img} alt=""
                                    onClick={() => setActiveImg(idx)}
                                    style={{
                                        width: '70px', height: '70px', objectFit: 'cover',
                                        borderRadius: '6px', cursor: 'pointer',
                                        border: activeImg === idx ? '2px solid #007BFF' : '2px solid transparent'
                                    }}
                                    onError={e => e.target.src = 'https://placehold.co/70x70'}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Thông tin sản phẩm */}
                <div style={{ flex: 1, minWidth: '280px' }}>
                    <h1 style={{ fontSize: '26px', color: '#1a1a2e', marginBottom: '8px' }}>{product.title}</h1>
                    <p style={{ color: '#666', fontSize: '13px', marginBottom: '12px' }}>
                        SKU: <strong>{product.sku}</strong>
                    </p>

                    {/* Đánh giá tổng quan */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                        <span style={{ fontSize: '22px', color: '#f59e0b' }}>{renderStars(avgRating)}</span>
                        <span style={{ color: '#666', fontSize: '14px' }}>
                            {avgRating}/5 ({reviews.length} đánh giá)
                        </span>
                    </div>

                    <p style={{ fontSize: '32px', color: '#e53935', fontWeight: 'bold', marginBottom: '15px' }}>
                        {product.price?.toLocaleString('vi-VN')} VNĐ
                    </p>

                    {/* Trạng thái kho */}
                    {inventory && (
                        <div style={{
                            background: inventory.stock > 10 ? '#e8f5e9' : inventory.stock > 0 ? '#fff3e0' : '#ffebee',
                            padding: '10px 15px', borderRadius: '8px', marginBottom: '15px'
                        }}>
                            <span style={{
                                color: inventory.stock > 10 ? '#2e7d32' : inventory.stock > 0 ? '#e65100' : '#c62828',
                                fontWeight: 'bold', fontSize: '14px'
                            }}>
                                {inventory.stock > 10 ? '✅ Còn hàng' : inventory.stock > 0 ? '⚠️ Sắp hết hàng' : '❌ Hết hàng'}
                            </span>
                            <span style={{ color: '#666', fontSize: '13px', marginLeft: '10px' }}>
                                | Kho: {inventory.stock} | Đã bán: {inventory.soldCount}
                            </span>
                        </div>
                    )}

                    <p style={{ color: '#555', lineHeight: '1.7', marginBottom: '20px' }}>{product.description}</p>

                    <button
                        onClick={addToCart}
                        disabled={inventory?.stock === 0}
                        style={{
                            ...btnStyle(inventory?.stock === 0 ? '#999' : '#28a745'),
                            width: '100%', padding: '14px', fontSize: '16px',
                            cursor: inventory?.stock === 0 ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {inventory?.stock === 0 ? '❌ Hết hàng' : '🛒 Thêm vào giỏ hàng'}
                    </button>
                </div>
            </div>

            {/* ===== REVIEWS SECTION ===== */}
            <div style={{ marginTop: '50px', borderTop: '2px solid #f0f0f0', paddingTop: '30px' }}>
                <h2 style={{ ...sectionTitle, fontSize: '20px' }}>⭐ Đánh Giá Sản Phẩm</h2>

                {/* Form đánh giá */}
                {token ? (
                    <form onSubmit={submitReview} style={{
                        ...cardStyle, marginBottom: '25px', background: '#f8f9fa'
                    }}>
                        <h4 style={{ marginBottom: '12px', color: '#1a1a2e' }}>✍️ Viết đánh giá của bạn:</h4>
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ fontSize: '14px', color: '#555' }}>Số sao: </label>
                            <select value={rating} onChange={e => setRating(e.target.value)}
                                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd', marginLeft: '8px' }}>
                                {[5, 4, 3, 2, 1].map(n => (
                                    <option key={n} value={n}>{n} sao {'⭐'.repeat(n)}</option>
                                ))}
                            </select>
                        </div>
                        <textarea
                            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            rows="4" required
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', resize: 'vertical' }}
                        />
                        <button type="submit" style={{ ...btnStyle('#007BFF'), marginTop: '10px' }}>
                            📤 Gửi đánh giá
                        </button>
                    </form>
                ) : (
                    <div style={{ ...cardStyle, textAlign: 'center', color: '#666', marginBottom: '20px' }}>
                        <Link to="/auth" style={{ color: '#007BFF' }}>🔑 Đăng nhập</Link> để viết đánh giá
                    </div>
                )}

                {/* Danh sách reviews */}
                {reviews.length === 0 ? (
                    <p style={{ color: '#999', textAlign: 'center', padding: '30px' }}>Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                ) : (
                    reviews.map(r => (
                        <div key={r._id} style={{ ...cardStyle, marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <img
                                    src={r.user?.avatarUrl || 'https://i.pravatar.cc/40'}
                                    alt=""
                                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                    onError={e => e.target.src = 'https://i.pravatar.cc/40'}
                                />
                                <div>
                                    <strong style={{ fontSize: '15px', color: '#1a1a2e' }}>{r.user?.fullName || r.user?.username || 'Khách'}</strong>
                                    <div style={{ fontSize: '12px', color: '#999' }}>
                                        {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                                    </div>
                                </div>
                                <span style={{ marginLeft: 'auto', color: '#f59e0b', fontSize: '18px' }}>
                                    {'⭐'.repeat(r.rating)}
                                </span>
                            </div>
                            <p style={{ color: '#555', margin: 0, lineHeight: '1.6' }}>{r.comment}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// =================== 4. GIỎ HÀNG (CARTS) ===================
function Cart({ token }) {
    const [cartItems, setCartItems] = useState([]);
    const [address, setAddress] = useState('');
    const [method, setMethod] = useState('COD');
    const [voucherCode, setVoucherCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (token) fetchCart();
        else setLoading(false);
    }, [token]);

    const fetchCart = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/carts`);
            const items = res.data;
            // Lấy chi tiết từng sản phẩm
            const detailed = await Promise.all(items.map(async item => {
                try {
                    const prod = await axios.get(`${API_URL}/products/${item.product}`);
                    return { ...item, details: prod.data };
                } catch {
                    return { ...item, details: null };
                }
            }));
            setCartItems(detailed.filter(i => i.details));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const removeProduct = async (productId) => {
        try {
            await axios.post(`${API_URL}/carts/remove`, { product: productId });
            fetchCart();
        } catch (err) {
            alert('❌ Lỗi xóa sản phẩm: ' + err.message);
        }
    };

    const applyVoucher = async () => {
        if (!voucherCode.trim()) return;
        try {
            const res = await axios.get(`${API_URL}/vouchers`);
            // Giả lập kiểm tra voucher từ danh sách
            const voucher = res.data.find(v =>
                v.code === voucherCode.toUpperCase() &&
                v.isActive &&
                new Date(v.expirationDate) > new Date()
            );
            if (voucher && total >= voucher.minOrderValue) {
                setDiscount(voucher.discountValue);
                alert(`✅ Áp dụng voucher thành công! Giảm ${voucher.discountValue.toLocaleString('vi-VN')} VNĐ`);
            } else if (voucher) {
                alert(`⚠️ Voucher yêu cầu đơn tối thiểu ${voucher.minOrderValue?.toLocaleString('vi-VN')} VNĐ`);
            } else {
                alert('❌ Voucher không hợp lệ hoặc đã hết hạn!');
                setDiscount(0);
            }
        } catch {
            alert('❌ Không thể kiểm tra voucher!');
        }
    };

    const handleCheckout = async (e) => {
        e.preventDefault();
        if (!address.trim()) return alert('⚠️ Vui lòng nhập địa chỉ giao hàng!');
        try {
            await axios.post(`${API_URL}/reservations/checkout`, {
                shippingAddress: address,
                paymentMethod: method
            });
            alert('🎉 ĐẶT HÀNG THÀNH CÔNG!\nChúng tôi sẽ liên hệ bạn sớm.');
            navigate('/orders');
        } catch (err) {
            alert('❌ Lỗi đặt hàng: ' + (err.response?.data?.message || err.message));
        }
    };

    if (!token) return (
        <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '60px' }}>🛒</div>
            <h3>Vui lòng đăng nhập để xem giỏ hàng</h3>
            <Link to="/auth"><button style={btnStyle()}>🔑 Đăng nhập ngay</button></Link>
        </div>
    );

    if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}>⏳ Đang tải giỏ hàng...</div>;

    const total = cartItems.reduce((s, item) => s + (item.details?.price || 0) * item.quantity, 0);
    const finalTotal = Math.max(0, total - discount);

    return (
        <div style={{ padding: '0 10px' }}>
            <h2 style={sectionTitle}>🛒 Giỏ Hàng Của Bạn</h2>

            {cartItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                    <div style={{ fontSize: '80px' }}>🛒</div>
                    <h3 style={{ color: '#999' }}>Giỏ hàng đang trống</h3>
                    <Link to="/"><button style={btnStyle()}>🛍️ Tiếp tục mua sắm</button></Link>
                </div>
            ) : (
                <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap' }}>
                    {/* Danh sách sản phẩm */}
                    <div style={{ flex: 2, minWidth: '300px' }}>
                        {cartItems.map((item, idx) => (
                            <div key={idx} style={{ ...cardStyle, display: 'flex', gap: '15px', marginBottom: '12px', alignItems: 'center' }}>
                                <img
                                    src={item.details?.images?.[0]}
                                    alt={item.details?.title}
                                    style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '8px' }}
                                    onError={e => e.target.src = 'https://placehold.co/90x90'}
                                />
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 5px', fontSize: '15px', color: '#1a1a2e' }}>{item.details?.title}</h4>
                                    <p style={{ color: '#e53935', fontWeight: 'bold', margin: '0 0 8px' }}>
                                        {item.details?.price?.toLocaleString('vi-VN')} VNĐ
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ color: '#666', fontSize: '14px' }}>Số lượng: <strong>{item.quantity}</strong></span>
                                        <span style={{ color: '#555', fontSize: '14px' }}>
                                            = <strong style={{ color: '#e53935' }}>{(item.details?.price * item.quantity).toLocaleString('vi-VN')} VNĐ</strong>
                                        </span>
                                    </div>
                                </div>
                                <button onClick={() => removeProduct(item.product)}
                                    style={{ ...btnStyle('#dc3545'), padding: '6px 12px' }}>
                                    🗑️ Xóa
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Form thanh toán */}
                    <div style={{ flex: 1, minWidth: '260px' }}>
                        <div style={{ ...cardStyle, background: '#f8f9fa' }}>
                            <h3 style={{ marginBottom: '15px', color: '#1a1a2e' }}>📋 Thông Tin Đặt Hàng</h3>

                            {/* Voucher */}
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '14px', color: '#555', display: 'block', marginBottom: '5px' }}>🎟️ Mã giảm giá:</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        value={voucherCode}
                                        onChange={e => setVoucherCode(e.target.value)}
                                        placeholder="Nhập mã voucher..."
                                        style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}
                                    />
                                    <button onClick={applyVoucher} style={btnStyle('#f59e0b')}>Áp dụng</button>
                                </div>
                                {discount > 0 && (
                                    <p style={{ color: '#28a745', fontSize: '13px', margin: '5px 0 0' }}>
                                        ✅ Giảm {discount.toLocaleString('vi-VN')} VNĐ
                                    </p>
                                )}
                            </div>

                            <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '14px', color: '#555', display: 'block', marginBottom: '5px' }}>📍 Địa chỉ giao hàng:</label>
                                    <textarea
                                        placeholder="Nhập địa chỉ đầy đủ..."
                                        value={address}
                                        onChange={e => setAddress(e.target.value)}
                                        required rows="3"
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box', resize: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '14px', color: '#555', display: 'block', marginBottom: '5px' }}>💳 Phương thức thanh toán:</label>
                                    <select value={method} onChange={e => setMethod(e.target.value)}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}>
                                        <option value="COD">💵 Thanh toán khi nhận hàng (COD)</option>
                                        <option value="ZALO_PAY">📱 Zalo Pay</option>
                                        <option value="ATM">🏧 ATM / Chuyển khoản</option>
                                    </select>
                                </div>

                                {/* Tổng tiền */}
                                <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px' }}>
                                        <span>Tạm tính:</span>
                                        <span>{total.toLocaleString('vi-VN')} VNĐ</span>
                                    </div>
                                    {discount > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px', color: '#28a745' }}>
                                            <span>Giảm giá:</span>
                                            <span>-{discount.toLocaleString('vi-VN')} VNĐ</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px', color: '#e53935', borderTop: '1px solid #eee', paddingTop: '8px' }}>
                                        <span>Tổng cộng:</span>
                                        <span>{finalTotal.toLocaleString('vi-VN')} VNĐ</span>
                                    </div>
                                </div>

                                <button type="submit" style={{ ...btnStyle('#28a745'), padding: '14px', fontSize: '16px', fontWeight: 'bold' }}>
                                    ✅ XÁC NHẬN ĐẶT HÀNG
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// =================== 5. LỊCH SỬ ĐƠN HÀNG (RESERVATIONS) ===================
function Orders({ token }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            axios.get(`${API_URL}/reservations/my-orders`)
                .then(res => { setOrders(res.data); setLoading(false); })
                .catch(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [token]);

    const statusConfig = {
        pending:   { color: '#f59e0b', bg: '#fffbeb', label: '⏳ Chờ xử lý',  icon: '⏳' },
        actived:   { color: '#3b82f6', bg: '#eff6ff', label: '🚚 Đang xử lý', icon: '🚚' },
        completed: { color: '#10b981', bg: '#ecfdf5', label: '✅ Hoàn thành',  icon: '✅' },
        cancelled: { color: '#ef4444', bg: '#fef2f2', label: '❌ Đã huỷ',     icon: '❌' }
    };

    if (!token) return (
        <div style={{ textAlign: 'center', padding: '60px' }}>
            <h3>Vui lòng đăng nhập để xem đơn hàng</h3>
            <Link to="/auth"><button style={btnStyle()}>🔑 Đăng nhập</button></Link>
        </div>
    );
    if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}>⏳ Đang tải...</div>;

    return (
        <div style={{ padding: '0 10px' }}>
            <h2 style={sectionTitle}>📦 Lịch Sử Đặt Hàng</h2>
            {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                    <div style={{ fontSize: '60px' }}>📦</div>
                    <h3 style={{ color: '#999' }}>Bạn chưa có đơn hàng nào</h3>
                    <Link to="/"><button style={btnStyle()}>🛍️ Mua sắm ngay</button></Link>
                </div>
            ) : (
                orders.map(order => {
                    const cfg = statusConfig[order.status] || statusConfig.pending;
                    return (
                        <div key={order._id} style={{ ...cardStyle, marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                                <div>
                                    <p style={{ margin: '0 0 5px', fontSize: '13px', color: '#999' }}>
                                        Mã đơn: <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}>{order._id}</code>
                                    </p>
                                    <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>
                                        📅 {new Date(order.createdAt).toLocaleString('vi-VN')} |
                                        📍 {order.shippingAddress} |
                                        💳 {order.paymentMethod}
                                    </p>
                                </div>
                                <span style={{
                                    background: cfg.bg, color: cfg.color,
                                    padding: '5px 14px', borderRadius: '20px',
                                    fontWeight: 'bold', fontSize: '13px'
                                }}>
                                    {cfg.label}
                                </span>
                            </div>
                            <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #f0f0f0' }} />
                            <div>
                                {order.products?.map((p, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px' }}>
                                        <span>• {p.title} <span style={{ color: '#999' }}>x{p.quantity}</span></span>
                                        <span style={{ color: '#555' }}>{(p.price * p.quantity).toLocaleString('vi-VN')} VNĐ</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ textAlign: 'right', marginTop: '12px', fontSize: '18px', fontWeight: 'bold', color: '#e53935' }}>
                                Tổng: {order.totalAmount?.toLocaleString('vi-VN')} VNĐ
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}

// =================== 6. TIN NHẮN (MESSAGES) ===================
function Messages({ token, currentUser }) {
    const [conversations, setConversations] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMsg, setNewMsg] = useState('');
    const [users, setUsers] = useState([]);

    useEffect(() => {
        if (token) {
            fetchUsers();
        }
    }, [token]);

    const fetchUsers = async () => {
        try {
            // Lấy tất cả users để chat (giả sử user thường chỉ thấy admin)
            const res = await axios.get(`${API_URL}/messages`);
            setConversations(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMessages = async (userId) => {
        setSelectedUser(userId);
        try {
            const res = await axios.get(`${API_URL}/messages/${userId}`);
            setMessages(res.data.reverse());
        } catch (err) {
            console.error(err);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMsg.trim() || !selectedUser) return;
        try {
            await axios.post(`${API_URL}/messages`, { to: selectedUser, text: newMsg });
            setNewMsg('');
            fetchMessages(selectedUser);
        } catch (err) {
            alert('❌ Lỗi gửi tin nhắn: ' + err.message);
        }
    };

    if (!token) return (
        <div style={{ textAlign: 'center', padding: '60px' }}>
            <h3>Vui lòng đăng nhập để xem tin nhắn</h3>
            <Link to="/auth"><button style={btnStyle()}>Đăng nhập</button></Link>
        </div>
    );

    return (
        <div style={{ padding: '0 10px' }}>
            <h2 style={sectionTitle}>💬 Tin Nhắn</h2>
            <div style={{ display: 'flex', gap: '20px', height: '500px' }}>
                {/* Danh sách hội thoại */}
                <div style={{ width: '250px', border: '1px solid #e0e0e0', borderRadius: '10px', overflow: 'auto' }}>
                    <div style={{ padding: '12px', background: '#f8f9fa', borderBottom: '1px solid #e0e0e0', fontWeight: 'bold' }}>
                        💬 Hội thoại
                    </div>
                    {conversations.length === 0 ? (
                        <p style={{ padding: '15px', color: '#999', fontSize: '13px' }}>Chưa có tin nhắn nào</p>
                    ) : (
                        conversations.map((conv, idx) => (
                            <div key={idx}
                                onClick={() => fetchMessages(conv.user)}
                                style={{
                                    padding: '12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0',
                                    background: selectedUser === conv.user ? '#e3f2fd' : 'white'
                                }}>
                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a1a2e' }}>
                                    {conv.message?.from?.username || 'Người dùng'}
                                </div>
                                <div style={{ fontSize: '12px', color: '#999', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {conv.message?.messageContent?.text || '...'}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Nội dung tin nhắn */}
                <div style={{ flex: 1, border: '1px solid #e0e0e0', borderRadius: '10px', display: 'flex', flexDirection: 'column' }}>
                    {!selectedUser ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '50px' }}>💬</div>
                                <p>Chọn một hội thoại để bắt đầu</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div style={{ padding: '12px', background: '#f8f9fa', borderBottom: '1px solid #e0e0e0', borderRadius: '10px 10px 0 0' }}>
                                <strong>Cuộc trò chuyện</strong>
                            </div>
                            <div style={{ flex: 1, overflow: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {messages.map(msg => {
                                    const isMe = msg.from?._id === currentUser?._id || msg.from === currentUser?._id;
                                    return (
                                        <div key={msg._id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                                            <div style={{
                                                maxWidth: '70%', padding: '10px 14px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                background: isMe ? '#007BFF' : '#f0f0f0',
                                                color: isMe ? 'white' : '#1a1a2e', fontSize: '14px'
                                            }}>
                                                {!isMe && <div style={{ fontSize: '11px', color: '#888', marginBottom: '3px' }}>{msg.from?.username}</div>}
                                                {msg.messageContent?.text}
                                                <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '3px', textAlign: 'right' }}>
                                                    {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <form onSubmit={sendMessage} style={{ padding: '12px', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '8px' }}>
                                <input
                                    value={newMsg} onChange={e => setNewMsg(e.target.value)}
                                    placeholder="Nhập tin nhắn..."
                                    style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '20px', outline: 'none', fontSize: '14px' }}
                                />
                                <button type="submit" style={btnStyle('#007BFF')}>📤 Gửi</button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// =================== 7. VOUCHERS ===================
function Vouchers() {
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Lấy vouchers - thường cần auth nhưng ta tạo endpoint public
        // Nếu không có endpoint, ta hiển thị hardcoded
        setVouchers([
            {
                _id: '1', code: 'WELCOME50K', discountValue: 50000,
                minOrderValue: 200000, isActive: true,
                expirationDate: new Date(Date.now() + 30 * 86400000)
            },
            {
                _id: '2', code: 'SALE20PERCENT', discountValue: 100000,
                minOrderValue: 500000, isActive: true,
                expirationDate: new Date(Date.now() + 7 * 86400000)
            },
            {
                _id: '3', code: 'FREESHIP2024', discountValue: 30000,
                minOrderValue: 0, isActive: false,
                expirationDate: new Date(Date.now() - 86400000)
            }
        ]);
        setLoading(false);
    }, []);

    const copyCode = (code) => {
        navigator.clipboard.writeText(code);
        alert(`✅ Đã copy mã: ${code}`);
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}>⏳ Đang tải...</div>;

    return (
        <div style={{ padding: '0 10px' }}>
            <h2 style={sectionTitle}>🎟️ Mã Giảm Giá</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                {vouchers.map(v => {
                    const isExpired = new Date(v.expirationDate) < new Date();
                    const isValid = v.isActive && !isExpired;
                    return (
                        <div key={v._id} style={{
                            ...cardStyle,
                            background: isValid ? 'linear-gradient(135deg, #fff9f0, #fff)' : '#f5f5f5',
                            border: isValid ? '2px dashed #f59e0b' : '2px dashed #ccc',
                            opacity: isValid ? 1 : 0.7
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{
                                    background: isValid ? '#f59e0b' : '#999', color: 'white',
                                    padding: '4px 12px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold'
                                }}>
                                    {isExpired ? 'HẾT HẠN' : isValid ? 'ĐANG HOẠT ĐỘNG' : 'VÔ HIỆU'}
                                </span>
                                <span style={{ fontSize: '24px' }}>🎟️</span>
                            </div>
                            <h3 style={{ fontSize: '22px', color: isValid ? '#f59e0b' : '#999', margin: '0 0 8px', fontFamily: 'monospace', letterSpacing: '2px' }}>
                                {v.code}
                            </h3>
                            <p style={{ color: '#e53935', fontWeight: 'bold', fontSize: '18px', margin: '0 0 5px' }}>
                                Giảm {v.discountValue?.toLocaleString('vi-VN')} VNĐ
                            </p>
                            {v.minOrderValue > 0 && (
                                <p style={{ color: '#666', fontSize: '13px', margin: '0 0 8px' }}>
                                    Đơn tối thiểu: {v.minOrderValue?.toLocaleString('vi-VN')} VNĐ
                                </p>
                            )}
                            <p style={{ color: '#999', fontSize: '12px', margin: '0 0 12px' }}>
                                HSD: {new Date(v.expirationDate).toLocaleDateString('vi-VN')}
                            </p>
                            {isValid && (
                                <button onClick={() => copyCode(v.code)} style={{ ...btnStyle('#f59e0b'), width: '100%' }}>
                                    📋 Copy mã giảm giá
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// =================== 8. DASHBOARD ADMIN ===================
// (Hiển thị: Users, Roles, Inventories, Statistics)
function Dashboard({ token, currentUser }) {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [inventories, setInventories] = useState([]);
    const [activeTab, setActiveTab] = useState('stats');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token && currentUser?.role?.name === 'ADMIN') {
            fetchAll();
        } else {
            setLoading(false);
        }
    }, [token, currentUser]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes, invRes] = await Promise.all([
                axios.get(`${API_URL}/statistics`),
                axios.get(`${API_URL}/users`),
                axios.get(`${API_URL}/inventories`)
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data);
            setInventories(invRes.data);
        } catch (err) {
            console.error('Dashboard error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!token || currentUser?.role?.name !== 'ADMIN') {
        return (
            <div style={{ textAlign: 'center', padding: '60px' }}>
                <div style={{ fontSize: '60px' }}>🔒</div>
                <h3 style={{ color: '#dc3545' }}>Bạn không có quyền truy cập trang này!</h3>
                <Link to="/"><button style={btnStyle()}>🏠 Về trang chủ</button></Link>
            </div>
        );
    }

    if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}>⏳ Đang tải Dashboard...</div>;

    const tabs = [
        { key: 'stats', label: '📊 Thống kê' },
        { key: 'users', label: '👥 Người dùng' },
        { key: 'inventory', label: '📦 Kho hàng' },
        { key: 'roles', label: '🔑 Vai trò' }
    ];

    return (
        <div style={{ padding: '0 10px' }}>
            <h2 style={sectionTitle}>⚙️ Dashboard Quản Trị</h2>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #e0e0e0', paddingBottom: '0' }}>
                {tabs.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        style={{
                            padding: '10px 20px', border: 'none', cursor: 'pointer',
                            background: activeTab === tab.key ? '#1a1a2e' : 'transparent',
                            color: activeTab === tab.key ? 'white' : '#666',
                            borderRadius: '6px 6px 0 0', fontSize: '14px', fontWeight: activeTab === tab.key ? 'bold' : 'normal'
                        }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab: Thống kê */}
            {activeTab === 'stats' && stats && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                        {[
                            { label: '👤 Người dùng', value: stats.totalUsers, color: '#3b82f6', bg: '#eff6ff' },
                            { label: '📦 Sản phẩm', value: stats.totalProducts, color: '#10b981', bg: '#ecfdf5' },
                            { label: '✅ Đơn hoàn thành', value: stats.completedOrders, color: '#f59e0b', bg: '#fffbeb' },
                            { label: '💰 Doanh thu', value: stats.totalRevenue?.toLocaleString('vi-VN') + ' VNĐ', color: '#e53935', bg: '#fef2f2' }
                        ].map((s, idx) => (
                            <div key={idx} style={{ ...cardStyle, textAlign: 'center', background: s.bg, border: `1px solid ${s.color}30` }}>
                                <div style={{ fontSize: '28px', fontWeight: 'bold', color: s.color }}>{s.value}</div>
                                <div style={{ color: '#666', fontSize: '13px', marginTop: '5px' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab: Người dùng */}
            {activeTab === 'users' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <span style={{ color: '#666', fontSize: '14px' }}>Tổng: {users.length} người dùng</span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ background: '#1a1a2e', color: 'white' }}>
                                    {['Avatar', 'Username', 'Họ tên', 'Email', 'Vai trò', 'Trạng thái'].map(h => (
                                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u, idx) => (
                                    <tr key={u._id} style={{ background: idx % 2 === 0 ? 'white' : '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
                                        <td style={{ padding: '8px 12px' }}>
                                            <img src={u.avatarUrl || 'https://i.pravatar.cc/35'} alt=""
                                                style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' }}
                                                onError={e => e.target.src = 'https://i.pravatar.cc/35'} />
                                        </td>
                                        <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#1a1a2e' }}>{u.username}</td>
                                        <td style={{ padding: '8px 12px' }}>{u.fullName || '-'}</td>
                                        <td style={{ padding: '8px 12px', color: '#666' }}>{u.email}</td>
                                        <td style={{ padding: '8px 12px' }}>
                                            <span style={{
                                                background: u.role?.name === 'ADMIN' ? '#dc3545' : u.role?.name === 'STAFF' ? '#f59e0b' : '#6c757d',
                                                color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '11px'
                                            }}>
                                                {u.role?.name || 'N/A'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '8px 12px' }}>
                                            <span style={{
                                                background: u.status ? '#dcfce7' : '#fee2e2',
                                                color: u.status ? '#16a34a' : '#dc2626',
                                                padding: '2px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold'
                                            }}>
                                                {u.status ? '✅ Hoạt động' : '🔒 Khoá'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab: Kho hàng (Inventories) */}
            {activeTab === 'inventory' && (
                <div>
                    <span style={{ color: '#666', fontSize: '14px', marginBottom: '15px', display: 'block' }}>
                        Tổng: {inventories.length} sản phẩm trong kho
                    </span>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ background: '#1a1a2e', color: 'white' }}>
                                    {['Sản phẩm', 'SKU', 'Tồn kho', 'Đang giữ', 'Đã bán', 'Trạng thái'].map(h => (
                                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {inventories.map((inv, idx) => {
                                    const stockStatus = inv.stock > 20 ? { color: '#16a34a', label: '✅ Đủ hàng' }
                                        : inv.stock > 0 ? { color: '#d97706', label: '⚠️ Sắp hết' }
                                        : { color: '#dc2626', label: '❌ Hết hàng' };
                                    return (
                                        <tr key={inv._id} style={{ background: idx % 2 === 0 ? 'white' : '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
                                            <td style={{ padding: '10px 12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <img src={inv.product?.images?.[0]} alt=""
                                                        style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px' }}
                                                        onError={e => e.target.src = 'https://placehold.co/45x45'} />
                                                    <span style={{ fontWeight: 'bold', color: '#1a1a2e', fontSize: '13px' }}>
                                                        {inv.product?.title || 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '10px 12px', color: '#666', fontFamily: 'monospace', fontSize: '12px' }}>
                                                {inv.product?.sku || '-'}
                                            </td>
                                            <td style={{ padding: '10px 12px', fontWeight: 'bold', fontSize: '16px', color: stockStatus.color }}>
                                                {inv.stock}
                                            </td>
                                            <td style={{ padding: '10px 12px', color: '#f59e0b', fontWeight: 'bold' }}>{inv.reserved}</td>
                                            <td style={{ padding: '10px 12px', color: '#3b82f6', fontWeight: 'bold' }}>{inv.soldCount}</td>
                                            <td style={{ padding: '10px 12px' }}>
                                                <span style={{ color: stockStatus.color, fontWeight: 'bold', fontSize: '13px' }}>
                                                    {stockStatus.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab: Roles */}
            {activeTab === 'roles' && <RolesPanel token={token} />}
        </div>
    );
}

// =================== 9. ROLES PANEL (trong Dashboard) ===================
function RolesPanel() {
    const [roles, setRoles] = useState([]);

    useEffect(() => {
        axios.get(`${API_URL}/roles`).then(res => setRoles(res.data));
    }, []);

    const roleColors = {
        ADMIN: '#dc3545', USER: '#3b82f6', STAFF: '#f59e0b',
        MANAGER: '#10b981', GUEST: '#6c757d'
    };

    return (
        <div>
            <h3 style={{ marginBottom: '15px', color: '#1a1a2e' }}>🔑 Danh sách Roles</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {roles.map(role => (
                    <div key={role._id} style={{ ...cardStyle, borderLeft: `4px solid ${roleColors[role.name] || '#999'}` }}>
                        <span style={{
                            background: roleColors[role.name] || '#999', color: 'white',
                            padding: '3px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold'
                        }}>
                            {role.name}
                        </span>
                        <p style={{ color: '#666', fontSize: '13px', margin: '8px 0 0' }}>{role.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Trang Roles riêng (accessible từ nav nếu cần)
function Roles({ token }) {
    return (
        <div style={{ padding: '0 10px' }}>
            <h2 style={sectionTitle}>🔑 Quản Lý Roles</h2>
            <RolesPanel token={token} />
        </div>
    );
}

// Trang Inventory riêng
function Inventory({ token }) {
    const [inventories, setInventories] = useState([]);

    useEffect(() => {
        axios.get(`${API_URL}/inventories`).then(res => setInventories(res.data));
    }, []);

    return (
        <div style={{ padding: '0 10px' }}>
            <h2 style={sectionTitle}>📦 Quản Lý Kho Hàng</h2>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#1a1a2e', color: 'white' }}>
                            <th style={{ padding: '10px' }}>Sản phẩm</th>
                            <th style={{ padding: '10px' }}>Tồn kho</th>
                            <th style={{ padding: '10px' }}>Đặt giữ</th>
                            <th style={{ padding: '10px' }}>Đã bán</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventories.map((inv, idx) => (
                            <tr key={inv._id} style={{ background: idx % 2 === 0 ? 'white' : '#f8f9fa', textAlign: 'center' }}>
                                <td style={{ padding: '10px', textAlign: 'left' }}>{inv.product?.title || 'N/A'}</td>
                                <td style={{ padding: '10px', fontWeight: 'bold', color: inv.stock > 0 ? '#16a34a' : '#dc2626' }}>{inv.stock}</td>
                                <td style={{ padding: '10px', color: '#f59e0b' }}>{inv.reserved}</td>
                                <td style={{ padding: '10px', color: '#3b82f6' }}>{inv.soldCount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// =================== 10. ĐĂNG NHẬP / ĐĂNG KÝ ===================
function Auth({ setToken }) {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ username: '', password: '', email: '', fullName: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const updateField = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (isLogin) {
                const res = await axios.post(`${API_URL}/auth/login`, {
                    username: formData.username,
                    password: formData.password
                });
                // Backend trả về { token: "..." }
                const token = res.data.token || res.data;
                setToken(token);
                localStorage.setItem('token', token);
                navigate('/');
            } else {
                // Lấy role USER từ DB
                const rolesRes = await axios.get(`${API_URL}/roles`);
                const userRole = rolesRes.data.find(r => r.name === 'USER')?._id;
                if (!userRole) throw new Error('Không tìm thấy role USER trong hệ thống!');

                await axios.post(`${API_URL}/auth/register`, {
                    username: formData.username,
                    password: formData.password,
                    email: formData.email,
                    fullName: formData.fullName,
                    role: userRole
                });
                alert('🎉 Đăng ký thành công! Vui lòng đăng nhập.');
                setIsLogin(true);
                setFormData({ username: formData.username, password: '', email: '', fullName: '' });
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data || err.message;
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
            <div style={{ ...cardStyle, padding: '30px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#1a1a2e' }}>
                    {isLogin ? '🔑 Đăng Nhập' : '📝 Đăng Ký'}
                </h2>

                {error && (
                    <div style={{
                        background: '#fef2f2', border: '1px solid #fca5a5',
                        color: '#dc2626', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px'
                    }}>
                        ❌ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                        <label style={{ fontSize: '14px', color: '#555', display: 'block', marginBottom: '5px' }}>👤 Username</label>
                        <input
                            placeholder="Nhập username..."
                            value={formData.username}
                            onChange={updateField('username')}
                            required autoComplete="username"
                            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '14px', color: '#555', display: 'block', marginBottom: '5px' }}>🔒 Mật khẩu</label>
                        <input
                            type="password"
                            placeholder={isLogin ? "Nhập mật khẩu..." : "Ít nhất 8 ký tự, có hoa, số, đặc biệt"}
                            value={formData.password}
                            onChange={updateField('password')}
                            required autoComplete={isLogin ? 'current-password' : 'new-password'}
                            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }}
                        />
                    </div>

                    {!isLogin && (
                        <>
                            <div>
                                <label style={{ fontSize: '14px', color: '#555', display: 'block', marginBottom: '5px' }}>📧 Email</label>
                                <input
                                    type="email" placeholder="example@email.com"
                                    value={formData.email} onChange={updateField('email')} required
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '14px', color: '#555', display: 'block', marginBottom: '5px' }}>🪪 Họ tên</label>
                                <input
                                    placeholder="Nguyễn Văn A"
                                    value={formData.fullName} onChange={updateField('fullName')}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }}
                                />
                            </div>
                        </>
                    )}

                    <button type="submit" disabled={loading}
                        style={{ ...btnStyle(loading ? '#999' : '#1a1a2e'), padding: '12px', fontSize: '15px', marginTop: '5px' }}>
                        {loading ? '⏳ Đang xử lý...' : isLogin ? '🚀 Đăng nhập' : '✅ Tạo tài khoản'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>
                    {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                    <span
                        onClick={() => { setIsLogin(!isLogin); setError(''); }}
                        style={{ color: '#007BFF', cursor: 'pointer', fontWeight: 'bold', marginLeft: '5px' }}
                    >
                        {isLogin ? ' Đăng ký ngay' : ' Đăng nhập'}
                    </span>
                </p>

                {isLogin && (
                    <div style={{ background: '#f0f9ff', padding: '12px', borderRadius: '8px', marginTop: '15px', fontSize: '13px' }}>
                        <strong>🔑 Tài khoản test:</strong><br />
                        Admin: <code>admin</code> / <code>Admin@123</code><br />
                        User: <code>minh_user</code> / <code>User@123</code>
                    </div>
                )}
            </div>
        </div>
    );
}