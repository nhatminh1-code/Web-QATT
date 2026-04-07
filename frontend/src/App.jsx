import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';

const API_URL = 'http://localhost:3000/api/v1';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  // Cấu hình axios gửi kèm token
  axios.interceptors.request.use(config => {
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  const logout = () => {
    setToken('');
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <BrowserRouter>
      <div style={{ maxWidth: '1000px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
        {/* NAVBAR */}
        <nav style={{ display: 'flex', gap: '20px', padding: '15px', background: '#333', color: 'white', borderRadius: '5px', marginBottom: '20px' }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>🛒 SPORT SHOP</Link>
          <div style={{ flex: 1 }}></div>
          {!token ? (
            <Link to="/auth" style={{ color: 'white', textDecoration: 'none' }}>Đăng nhập / Đăng ký</Link>
          ) : (
            <>
              <Link to="/cart" style={{ color: 'white', textDecoration: 'none' }}>Giỏ hàng</Link>
              <Link to="/orders" style={{ color: 'white', textDecoration: 'none' }}>Đơn hàng của tôi</Link>
              <button onClick={logout} style={{ background: 'red', color: 'white', border: 'none', cursor: 'pointer', padding: '5px 10px' }}>Đăng xuất</button>
            </>
          )}
        </nav>

        {/* ROUTES */}
        <Routes>
          <Route path="/" element={<Home token={token} />} />
          <Route path="/auth" element={<Auth setToken={setToken} />} />
          <Route path="/product/:id" element={<ProductDetail token={token} />} />
          <Route path="/cart" element={<Cart token={token} />} />
          <Route path="/orders" element={<Orders token={token} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

// ================= COMPONENT DANH SÁCH SẢN PHẨM =================
function Home({ token }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/products`).then(res => setProducts(res.data)).catch(err => console.log(err));
  }, []);

  return (
    <div>
      <h2>DANH SÁCH QUẦN ÁO THỂ THAO</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {products.map(p => (
          <div key={p._id} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            <img src={p.images[0]} alt={p.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            <h4 style={{ margin: '10px 0', fontSize: '16px' }}>{p.title}</h4>
            <p style={{ color: 'red', fontWeight: 'bold' }}>{p.price.toLocaleString()} VNĐ</p>
            <Link to={`/product/${p._id}`}>
              <button style={{ width: '100%', padding: '10px', background: '#007BFF', color: 'white', border: 'none', cursor: 'pointer' }}>Xem chi tiết</button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

// ================= COMPONENT CHI TIẾT SẢN PHẨM & BÌNH LUẬN =================
function ProductDetail({ token }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);

  useEffect(() => {
    axios.get(`${API_URL}/products/${id}`).then(res => setProduct(res.data));
    fetchReviews();
  }, [id]);

  const fetchReviews = () => {
    axios.get(`${API_URL}/reviews/product/${id}`).then(res => setReviews(res.data)).catch(() => {});
  };

  const addToCart = async () => {
    if (!token) return alert('Vui lòng đăng nhập!');
    try {
      await axios.post(`${API_URL}/carts/add`, { product: id });
      alert('Đã thêm vào giỏ hàng!');
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!token) return alert('Vui lòng đăng nhập để bình luận!');
    try {
      await axios.post(`${API_URL}/reviews`, { product: id, rating, comment });
      setComment('');
      fetchReviews();
      alert('Đã gửi đánh giá!');
    } catch (error) {
      alert('Lỗi gửi đánh giá');
    }
  };

  if (!product) return <p>Đang tải...</p>;

  return (
    <div style={{ display: 'flex', gap: '40px' }}>
      <div style={{ flex: 1 }}>
        <img src={product.images[0]} style={{ width: '100%', borderRadius: '8px' }} />
      </div>
      <div style={{ flex: 1 }}>
        <h2>{product.title}</h2>
        <h3 style={{ color: 'red' }}>Giá: {product.price.toLocaleString()} VNĐ</h3>
        <p><b>Mô tả:</b> {product.description}</p>
        <button onClick={addToCart} style={{ padding: '15px', background: 'green', color: 'white', border: 'none', fontSize: '16px', cursor: 'pointer', width: '100%' }}>
          THÊM VÀO GIỎ HÀNG
        </button>

        <hr style={{ margin: '30px 0' }} />
        
        {/* Khu vực Bình luận */}
        <h3>Bình luận & Đánh giá</h3>
        <form onSubmit={submitReview} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <select value={rating} onChange={e => setRating(e.target.value)} style={{ padding: '5px' }}>
            <option value="5">5 Sao ⭐⭐⭐⭐⭐</option>
            <option value="4">4 Sao ⭐⭐⭐⭐</option>
            <option value="3">3 Sao ⭐⭐⭐</option>
            <option value="2">2 Sao ⭐⭐</option>
            <option value="1">1 Sao ⭐</option>
          </select>
          <textarea placeholder="Nhập bình luận của bạn..." value={comment} onChange={e => setComment(e.target.value)} rows="3" required style={{ padding: '10px' }}></textarea>
          <button type="submit" style={{ padding: '10px', background: '#333', color: 'white', border: 'none' }}>Gửi bình luận</button>
        </form>

        <ul style={{ listStyle: 'none', padding: 0 }}>
          {reviews.map(r => (
            <li key={r._id} style={{ background: '#f9f9f9', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
              <b>{r.user?.username || 'Khách'}</b> - {r.rating} Sao <br/>
              {r.comment}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ================= COMPONENT GIỎ HÀNG & THANH TOÁN =================
function Cart({ token }) {
  const [cartItems, setCartItems] = useState([]);
  const [address, setAddress] = useState('');
  const [method, setMethod] = useState('COD');
  const navigate = useNavigate();

  useEffect(() => {
    if (token) fetchCart();
  }, [token]);

  // Cần gọi API lấy thông tin sản phẩm chi tiết vì cart trả về array [{product: "id", quantity: 1}]
  const fetchCart = async () => {
    try {
      const res = await axios.get(`${API_URL}/carts`);
      // Lấy chi tiết từng sản phẩm
      const items = res.data;
      const detailedItems = await Promise.all(items.map(async (item) => {
        const prod = await axios.get(`${API_URL}/products/${item.product}`);
        return { ...item, details: prod.data };
      }));
      setCartItems(detailedItems);
    } catch (err) {
      console.log(err);
    }
  };

  const removeProduct = async (productId) => {
    await axios.post(`${API_URL}/carts/remove`, { product: productId });
    fetchCart();
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/reservations/checkout`, { shippingAddress: address, paymentMethod: method });
      alert('ĐẶT HÀNG THÀNH CÔNG!');
      navigate('/orders');
    } catch (error) {
      alert('Lỗi đặt hàng: ' + (error.response?.data?.message || error.message));
    }
  };

  let total = cartItems.reduce((sum, item) => sum + (item.details?.price * item.quantity), 0);

  return (
    <div>
      <h2>Giỏ Hàng Của Bạn</h2>
      {cartItems.length === 0 ? <p>Giỏ hàng đang trống.</p> : (
        <div style={{ display: 'flex', gap: '30px' }}>
          <div style={{ flex: 2 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead><tr style={{ background: '#eee' }}><th>Sản phẩm</th><th>Số lượng</th><th>Giá</th><th>Hành động</th></tr></thead>
              <tbody>
                {cartItems.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #ccc' }}>
                    <td style={{ padding: '10px 0' }}>{item.details?.title}</td>
                    <td>{item.quantity}</td>
                    <td>{(item.details?.price * item.quantity).toLocaleString()}đ</td>
                    <td><button onClick={() => removeProduct(item.product)} style={{ background: 'red', color: 'white' }}>Xóa</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3 style={{ textAlign: 'right', color: 'red' }}>Tổng tiền: {total.toLocaleString()} VNĐ</h3>
          </div>

          <div style={{ flex: 1, background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
            <h3>Thông tin Đặt hàng</h3>
            <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input placeholder="Địa chỉ giao hàng" value={address} onChange={e => setAddress(e.target.value)} required style={{ padding: '10px' }} />
              <select value={method} onChange={e => setMethod(e.target.value)} style={{ padding: '10px' }}>
                <option value="COD">Thanh toán khi nhận hàng (COD)</option>
                <option value="ZALO_PAY">Zalo Pay</option>
              </select>
              <button type="submit" style={{ padding: '15px', background: 'green', color: 'white', border: 'none', fontWeight: 'bold' }}>XÁC NHẬN ĐẶT HÀNG</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ================= COMPONENT LỊCH SỬ ĐƠN HÀNG =================
function Orders({ token }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/reservations/my-orders`).then(res => setOrders(res.data));
    }
  }, [token]);

  return (
    <div>
      <h2>Lịch Sử Đặt Hàng</h2>
      {orders.map(order => (
        <div key={order._id} style={{ border: '1px solid #ccc', margin: '15px 0', padding: '15px', borderRadius: '5px' }}>
          <p><b>Mã đơn:</b> {order._id} | <b>Ngày đặt:</b> {new Date(order.createdAt).toLocaleString()}</p>
          <p><b>Trạng thái:</b> <span style={{ color: order.status === 'completed' ? 'green' : 'orange' }}>{order.status.toUpperCase()}</span></p>
          <p><b>Địa chỉ:</b> {order.shippingAddress} | <b>Thanh toán:</b> {order.paymentMethod}</p>
          <hr />
          <ul>
            {order.products.map(p => (
              <li key={p.product}>{p.title} - SL: {p.quantity} - {p.price.toLocaleString()}đ</li>
            ))}
          </ul>
          <h3 style={{ color: 'red', textAlign: 'right' }}>Tổng hóa đơn: {order.totalAmount.toLocaleString()} VNĐ</h3>
        </div>
      ))}
    </div>
  );
}

// ================= COMPONENT LOGIN / REGISTER =================
function Auth({ setToken }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '', email: '', fullName: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await axios.post(`${API_URL}/auth/login`, { username: formData.username, password: formData.password });
        setToken(res.data);
        localStorage.setItem('token', res.data);
        alert('Đăng nhập thành công!');
        navigate('/');
      } else {
        // Lấy ID Role User mặc định từ DB của bạn, hoặc fix cứng id Role (Nhớ đổi lại ID Role USER ở DB của bạn)
        const roleRes = await axios.get(`${API_URL}/roles`); 
        const userRole = roleRes.data.find(r => r.name === "USER")?._id || "69b0ddec842e41e8160132b8"; 

        await axios.post(`${API_URL}/auth/register`, { ...formData, role: userRole });
        alert('Đăng ký thành công! Hãy đăng nhập.');
        setIsLogin(true);
      }
    } catch (err) {
      alert('Lỗi: ' + JSON.stringify(err.response?.data || err.message));
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
      <h2>{isLogin ? 'Đăng Nhập' : 'Đăng Ký'}</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input placeholder="Username" required onChange={e => setFormData({...formData, username: e.target.value})} style={{ padding: '10px' }} />
        <input type="password" placeholder="Password (phải có ký tự hoa, số, đặc biệt)" required onChange={e => setFormData({...formData, password: e.target.value})} style={{ padding: '10px' }} />
        {!isLogin && (
          <>
            <input type="email" placeholder="Email" required onChange={e => setFormData({...formData, email: e.target.value})} style={{ padding: '10px' }} />
            <input placeholder="Họ Tên" onChange={e => setFormData({...formData, fullName: e.target.value})} style={{ padding: '10px' }} />
          </>
        )}
        <button type="submit" style={{ padding: '10px', background: '#007BFF', color: 'white', border: 'none', cursor: 'pointer' }}>
          {isLogin ? 'Đăng nhập' : 'Đăng ký ngay'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '15px', color: 'blue', cursor: 'pointer' }} onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
      </p>
    </div>
  );
}