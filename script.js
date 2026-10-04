// --- HÀM KIỂM TRA & KHỞI TẠO ICON AN TOÀN ---
function safeCreateIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

// --- BẢO MẬT: MÃ HÓA MẬT KHẨU VỚI SHA-256 ---
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- DỮ LIỆU BAN ĐẦU ---
const INITIAL_PRODUCTS = [
  { id: '1', name: 'Sữa Hạt Óc Chó Yến Mạch', category: 'Sữa hạt béo', price: 35000, img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80', desc: 'Bổ sung Omega-3, tốt cho trí nào và tim mạch.' },
  { id: '2', name: 'Sữa Hạnh Nhân Hạt Chia', category: 'Sữa hạt béo', price: 38000, img: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&q=80', desc: 'Thơm béo nhẹ, giàu Vitamin E và chất xơ.' },
  { id: '3', name: 'Sữa Hạt Sen Đậu Xanh', category: 'Sữa hạt thanh', price: 30000, img: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&q=80', desc: 'Thanh nhiệt, an thần, giúp ngủ ngon sâu giấc.' },
  { id: '4', name: 'Sữa Macca Đậu Đỏ', category: 'Sữa hạt béo', price: 42000, img: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&q=80', desc: 'Nữ hoàng hạt dinh dưỡng kết hợp đạm thực vật.' },
  { id: '5', name: 'Sữa Gạo Lứt Lúa Mạch', category: 'Sữa ngũ cốc', price: 28000, img: 'https://images.unsplash.com/photo-1600718374662-0483d2b9da44?w=500&q=80', desc: 'Hỗ trợ giảm cân, tốt cho hệ tiêu hóa.' },
  { id: '6', name: 'Sữa Hạt Cừu Mầm Lúa Miêu', category: 'Sữa ngũ cốc', price: 32000, img: 'https://images.unsplash.com/photo-1528498033373-3c6c08e93d79?w=500&q=80', desc: 'Tăng cường sức đề kháng, thơm dịu tự nhiên.' }
];
// --- KHỞI TẠO LOCALSTORAGE ---
async function initDatabase() {
  if (!localStorage.getItem('nutmilk_products')) {
    localStorage.setItem('nutmilk_products', JSON.stringify(INITIAL_PRODUCTS));
  }
  
  if (!localStorage.getItem('nutmilk_users')) {
    const admin1Hash = await hashPassword('thanhtuyen123');
    const admin2Hash = await hashPassword('phucan123');
    const admin3Hash = await hashPassword('besau123');
    const userHash = await hashPassword('user123');
    
    const initialUsers = [
      { username: 'tranthithanhtuyen2007@', name: 'Trần Thị Thanh Tuyền', passwordHash: admin1Hash, role: 'admin' },
      { username: 'tranlephucan2007@', name: 'Trần Lê Phúc An', passwordHash: admin2Hash, role: 'admin' },
      { username: 'lethibesau1984@', name: 'Lê Thị Bé Sáu', passwordHash: admin3Hash, role: 'admin' },
      { username: 'user', name: 'Nguyễn Văn Khách', passwordHash: userHash, role: 'user' }
    ];
    localStorage.setItem('nutmilk_users', JSON.stringify(initialUsers));
  }

  if (!localStorage.getItem('nutmilk_orders')) {
    localStorage.setItem('nutmilk_orders', JSON.stringify([]));
  }
}

// --- TRẠNG THÁI ỨNG DỤNG ---
let state = {
  currentUser: JSON.parse(localStorage.getItem('nutmilk_session')) || null,
  cart: JSON.parse(localStorage.getItem('nutmilk_cart')) || [],
  activeCategory: 'all',
  searchQuery: ''
};

// --- KHỞI CHẠY KHI TRANG TẢI XONG ---
document.addEventListener('DOMContentLoaded', async () => {
  await initDatabase();
  updateAuthUI();
  renderProducts();
  renderCart();
  safeCreateIcons();
});

// --- TIỆN ÍCH GIÁ CẢ & TOAST ---
function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-emerald-800' : 'bg-red-700';
  toast.className = `toast ${bg} text-white px-4 py-3 rounded-lg shadow-xl text-sm font-medium flex items-center gap-2 animate-fade-in`;
  toast.innerHTML = `<span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function switchView(viewName) {
  // Ẩn tất cả các view
  document.getElementById('view-shop').classList.add('hidden');
  document.getElementById('view-cart').classList.add('hidden');
  document.getElementById('view-admin').classList.add('hidden');
  if (document.getElementById('view-contact')) {
    document.getElementById('view-contact').classList.add('hidden');
  }

  // Hiển thị view được chọn
  if (viewName === 'admin') {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
      showToast('Bạn cần đăng nhập tài khoản Admin!', 'error');
      openLoginModal();
      return;
    }
    document.getElementById('view-admin').classList.remove('hidden');
    renderAdminDashboard();
  } else if (viewName === 'cart') {
    document.getElementById('view-cart').classList.remove('hidden');
  } else if (viewName === 'contact') {
    document.getElementById('view-contact').classList.remove('hidden');
  } else {
    document.getElementById('view-shop').classList.remove('hidden');
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Hàm xử lý khi khách hàng gửi form Liên hệ
function handleSendContact(e) {
  e.preventDefault();
  showToast("Cảm ơn bạn! Yêu cầu hỗ trợ đã được gửi thành công.");
  e.target.reset();
}

// --- AUTHENTICATION & LOGIN ---
function openLoginModal() {
  document.getElementById('modal-auth').classList.remove('hidden');
}

function closeAuthModal() {
  document.getElementById('modal-auth').classList.add('hidden');
}

function switchAuthTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('form-login').classList.toggle('hidden', !isLogin);
  document.getElementById('form-register').classList.toggle('hidden', isLogin);
  
  document.getElementById('tab-btn-login').className = isLogin ? 
    "w-1/2 py-2.5 font-bold text-center border-b-2 border-emerald-600 text-emerald-700" :
    "w-1/2 py-2.5 font-medium text-center text-gray-400 hover:text-gray-600";
    
  document.getElementById('tab-btn-register').className = !isLogin ? 
    "w-1/2 py-2.5 font-bold text-center border-b-2 border-emerald-600 text-emerald-700" :
    "w-1/2 py-2.5 font-medium text-center text-gray-400 hover:text-gray-600";
}

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  const hashed = await hashPassword(password);
  const users = JSON.parse(localStorage.getItem('nutmilk_users')) || [];
  
  const foundUser = users.find(u => u.username === username && u.passwordHash === hashed);

  if (foundUser) {
    state.currentUser = { username: foundUser.username, name: foundUser.name, role: foundUser.role };
    localStorage.setItem('nutmilk_session', JSON.stringify(state.currentUser));
    updateAuthUI();
    closeAuthModal();
    showToast(`Xin chào trở lại, ${foundUser.name}!`);
    
    document.getElementById('cust-name').value = foundUser.name;
  } else {
    errorEl.textContent = "Tên đăng nhập hoặc mật khẩu không chính xác.";
    errorEl.classList.remove('hidden');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('reg-username').value.trim();
  const fullname = document.getElementById('reg-fullname').value.trim();
  const password = document.getElementById('reg-password').value;
  const errorEl = document.getElementById('reg-error');

  const users = JSON.parse(localStorage.getItem('nutmilk_users')) || [];
  if (users.some(u => u.username === username)) {
    errorEl.textContent = "Tên tài khoản này đã tồn tại.";
    errorEl.classList.remove('hidden');
    return;
  }

  const passwordHash = await hashPassword(password);
  const newUser = { username, name: fullname, passwordHash, role: 'user' };
  users.push(newUser);
  localStorage.setItem('nutmilk_users', JSON.stringify(users));

  state.currentUser = { username: newUser.username, name: newUser.name, role: newUser.role };
  localStorage.setItem('nutmilk_session', JSON.stringify(state.currentUser));

  updateAuthUI();
  closeAuthModal();
  showToast("Tạo tài khoản thành công!");
}

function handleLogout() {
  state.currentUser = null;
  localStorage.removeItem('nutmilk_session');
  updateAuthUI();
  switchView('shop');
  showToast("Đã đăng xuất tài khoản!");
}

function updateAuthUI() {
  const userNav = document.getElementById('user-nav-item');
  const loginBtn = document.getElementById('login-nav-btn');
  const adminBtn = document.getElementById('admin-dashboard-btn');
  const userText = document.getElementById('username-text');

  if (state.currentUser) {
    userNav.classList.remove('hidden');
    loginBtn.classList.add('hidden');
    userText.textContent = state.currentUser.name;

    if (state.currentUser.role === 'admin') {
      adminBtn.classList.remove('hidden');
    } else {
      adminBtn.classList.add('hidden');
    }
  } else {
    userNav.classList.add('hidden');
    loginBtn.classList.remove('hidden');
  }
}

// --- RENDERING CỬA HÀNG SẢN PHẨM ---
function renderProducts() {
  const products = JSON.parse(localStorage.getItem('nutmilk_products')) || [];
  const grid = document.getElementById('product-grid');
  
  const filtered = products.filter(p => {
    const matchCat = state.activeCategory === 'all' || p.category === state.activeCategory;
    const matchSearch = p.name.toLowerCase().includes(state.searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="col-span-full text-center py-12 text-gray-400">Không tìm thấy món sữa hạt nào phù hợp.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => `
    <div class="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition border border-emerald-100 flex flex-col justify-between">
      <div>
        <img src="${p.img}" alt="${p.name}" class="w-full h-48 object-cover">
        <div class="p-4 space-y-2">
          <span class="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">${p.category}</span>
          <h3 class="font-bold text-gray-800 text-base leading-tight">${p.name}</h3>
          <p class="text-xs text-gray-500 line-clamp-2">${p.desc}</p>
        </div>
      </div>
      <div class="p-4 pt-0 space-y-3">
        <div>
          <label class="text-[11px] font-medium text-gray-500 block mb-1">Mức đường:</label>
          <select id="sugar-${p.id}" class="w-full text-xs border rounded p-1 focus:outline-none focus:ring-1 focus:ring-emerald-500">
            <option value="100% đường">100% Đường chuẩn</option>
            <option value="50% đường">50% Ít đường</option>
            <option value="30% đường">30% Thật ít đường</option>
            <option value="0% đường">0% Nguyên chất (Không đường)</option>
          </select>
        </div>
        <div class="flex items-center justify-between pt-2 border-t">
          <span class="font-bold text-emerald-700 text-base">${formatVND(p.price)}</span>
          <button onclick="addToCart('${p.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition flex items-center gap-1 shadow">
            <i data-lucide="plus" class="w-4 h-4"></i> Thêm món
          </button>
        </div>
      </div>
    </div>
  `).join('');
  
  safeCreateIcons();
}

function filterCategory(cat) {
  state.activeCategory = cat;
  document.querySelectorAll('#category-tabs .cat-btn').forEach(btn => {
    if (btn.dataset.cat === cat) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  renderProducts();
}

function handleSearch() {
  state.searchQuery = document.getElementById('search-input').value;
  renderProducts();
}

// --- QUẢN LÝ GIỎ HÀNG ---
function addToCart(productId) {
  const products = JSON.parse(localStorage.getItem('nutmilk_products')) || [];
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const sugarSelect = document.getElementById(`sugar-${productId}`);
  const sugarOption = sugarSelect ? sugarSelect.value : '100% đường';

  const cartItemIndex = state.cart.findIndex(i => i.id === productId && i.sugar === sugarOption);
  if (cartItemIndex > -1) {
    state.cart[cartItemIndex].qty += 1;
  } else {
    state.cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      img: product.img,
      sugar: sugarOption,
      qty: 1
    });
  }

  saveCart();
  showToast(`Đã thêm "${product.name}" vào giỏ!`);
}

function updateCartQty(index, delta) {
  state.cart[index].qty += delta;
  if (state.cart[index].qty <= 0) {
    state.cart.splice(index, 1);
  }
  saveCart();
}

function removeCartItem(index) {
  state.cart.splice(index, 1);
  saveCart();
}

function saveCart() {
  localStorage.setItem('nutmilk_cart', JSON.stringify(state.cart));
  renderCart();
}

function renderCart() {
  const container = document.getElementById('cart-items-container');
  const emptyMsg = document.getElementById('empty-cart-msg');
  const badge = document.getElementById('cart-badge');

  const totalItems = state.cart.reduce((sum, item) => sum + item.qty, 0);
  badge.textContent = totalItems;

  if (state.cart.length === 0) {
    container.innerHTML = '';
    emptyMsg.classList.remove('hidden');
    document.getElementById('cart-subtotal').textContent = '0 đ';
    document.getElementById('cart-total').textContent = '0 đ';
    return;
  }

  emptyMsg.classList.add('hidden');
  let subtotal = 0;

  container.innerHTML = state.cart.map((item, index) => {
    const itemTotal = item.price * item.qty;
    subtotal += itemTotal;
    return `
      <div class="py-4 flex items-center justify-between gap-4">
        <div class="flex items-center space-x-3">
          <img src="${item.img}" class="w-14 h-14 object-cover rounded-lg">
          <div>
            <h4 class="font-bold text-gray-800 text-sm">${item.name}</h4>
            <p class="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded inline-block font-medium">${item.sugar}</p>
            <p class="text-xs text-emerald-700 font-bold mt-1">${formatVND(item.price)}</p>
          </div>
        </div>

        <div class="flex items-center space-x-3">
          <div class="flex items-center border rounded-lg overflow-hidden">
            <button onclick="updateCartQty(${index}, -1)" class="px-2 py-1 bg-gray-50 hover:bg-gray-200 text-gray-600 font-bold text-xs">-</button>
            <span class="px-3 py-1 text-xs font-bold">${item.qty}</span>
            <button onclick="updateCartQty(${index}, 1)" class="px-2 py-1 bg-gray-50 hover:bg-gray-200 text-gray-600 font-bold text-xs">+</button>
          </div>
          <span class="font-bold text-sm text-gray-800 w-20 text-right">${formatVND(itemTotal)}</span>
          <button onclick="removeCartItem(${index})" class="text-red-400 hover:text-red-600 p-1">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('cart-subtotal').textContent = formatVND(subtotal);
  document.getElementById('cart-total').textContent = formatVND(subtotal);
  safeCreateIcons();
}

// --- XỬ LÝ GỬI YÊU CẦU LIÊN HỆ ---
function handleSendContact(e) {
  e.preventDefault();
  showToast("Cảm ơn bạn! Yêu cầu hỗ trợ đã được gửi thành công.");
  e.target.reset();
}

// --- THANH TOÁN ĐƠN HÀNG ---
function handleCheckout(e) {
  e.preventDefault();
  if (state.cart.length === 0) {
    showToast('Giỏ hàng trống, hãy chọn món trước!', 'error');
    return;
  }

  const orders = JSON.parse(localStorage.getItem('nutmilk_orders')) || [];
  const totalAmount = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const newOrder = {
    id: 'NM-' + Math.floor(100000 + Math.random() * 900000),
    customer: {
      name: document.getElementById('cust-name').value,
      phone: document.getElementById('cust-phone').value,
      address: document.getElementById('cust-address').value,
      note: document.getElementById('cust-note').value
    },
    items: [...state.cart],
    total: totalAmount,
    status: 'Chờ xử lý',
    createdAt: new Date().toLocaleString('vi-VN')
  };

  orders.unshift(newOrder);
  localStorage.setItem('nutmilk_orders', JSON.stringify(orders));

  state.cart = [];
  saveCart();
  document.getElementById('checkout-form').reset();

  showToast('Đặt hàng thành công! Mã đơn: ' + newOrder.id);
  switchView('shop');
}

// --- TÍNH NĂNG QUẢN TRỊ (ADMIN) ---
function renderAdminDashboard() {
  const products = JSON.parse(localStorage.getItem('nutmilk_products')) || [];
  const orders = JSON.parse(localStorage.getItem('nutmilk_orders')) || [];

  document.getElementById('stat-total-products').textContent = products.length;
  document.getElementById('stat-total-orders').textContent = orders.length;
  const rev = orders.reduce((sum, o) => sum + o.total, 0);
  document.getElementById('stat-revenue').textContent = formatVND(rev);

  const orderTable = document.getElementById('admin-orders-table');
  if (orders.length === 0) {
    orderTable.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-400">Chưa có đơn hàng nào.</td></tr>`;
  } else {
    orderTable.innerHTML = orders.map(o => `
      <tr>
        <td class="p-3 font-bold text-emerald-800">${o.id}<br><span class="text-[10px] text-gray-400 font-normal">${o.createdAt}</span></td>
        <td class="p-3">
          <div class="font-semibold">${o.customer.name}</div>
          <div class="text-xs text-gray-500">${o.customer.phone}</div>
          <div class="text-[11px] text-gray-400 max-w-xs truncate">${o.customer.address}</div>
        </td>
        <td class="p-3 text-xs">
          ${o.items.map(i => `<div>• ${i.name} (x${i.qty}) <span class="text-amber-600">(${i.sugar})</span></div>`).join('')}
        </td>
        <td class="p-3 font-bold text-emerald-700">${formatVND(o.total)}</td>
        <td class="p-3">
          <select onchange="updateOrderStatus('${o.id}', this.value)" class="text-xs border rounded p-1 font-medium focus:outline-none">
            <option value="Chờ xử lý" ${o.status === 'Chờ xử lý' ? 'selected' : ''}>Chờ xử lý</option>
            <option value="Đang pha chế" ${o.status === 'Đang pha chế' ? 'selected' : ''}>Đang pha chế</option>
            <option value="Đang giao" ${o.status === 'Đang giao' ? 'selected' : ''}>Đang giao</option>
            <option value="Hoàn thành" ${o.status === 'Hoàn thành' ? 'selected' : ''}>Hoàn thành</option>
          </select>
        </td>
        <td class="p-3 text-right">
          <button onclick="deleteOrder('${o.id}')" class="text-red-500 hover:text-red-700 p-1">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  const prodTable = document.getElementById('admin-products-table');
  prodTable.innerHTML = products.map(p => `
    <tr>
      <td class="p-3"><img src="${p.img}" class="w-10 h-10 object-cover rounded"></td>
      <td class="p-3 font-bold text-gray-800">${p.name}</td>
      <td class="p-3"><span class="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">${p.category}</span></td>
      <td class="p-3 font-bold text-emerald-700">${formatVND(p.price)}</td>
      <td class="p-3 text-right">
        <button onclick="deleteProduct('${p.id}')" class="text-red-500 hover:text-red-700 font-medium text-xs border border-red-200 px-2 py-1 rounded">
          Xóa
        </button>
      </td>
    </tr>
  `).join('');

  safeCreateIcons();
}

function updateOrderStatus(orderId, newStatus) {
  const orders = JSON.parse(localStorage.getItem('nutmilk_orders')) || [];
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx > -1) {
    orders[idx].status = newStatus;
    localStorage.setItem('nutmilk_orders', JSON.stringify(orders));
    showToast(`Đã cập nhật đơn ${orderId} thành: ${newStatus}`);
  }
}

function deleteOrder(orderId) {
  if (!confirm(`Bạn chắc chắn muốn xóa đơn hàng ${orderId}?`)) return;
  let orders = JSON.parse(localStorage.getItem('nutmilk_orders')) || [];
  orders = orders.filter(o => o.id !== orderId);
  localStorage.setItem('nutmilk_orders', JSON.stringify(orders));
  renderAdminDashboard();
  showToast("Đã xóa đơn hàng!");
}

function openAddProductModal() {
  document.getElementById('modal-product').classList.remove('hidden');
}

function closeAddProductModal() {
  document.getElementById('modal-product').classList.add('hidden');
}

function handleSaveProduct(e) {
  e.preventDefault();
  const products = JSON.parse(localStorage.getItem('nutmilk_products')) || [];

  const newProd = {
    id: Date.now().toString(),
    name: document.getElementById('prod-name').value.trim(),
    category: document.getElementById('prod-category').value,
    price: Number(document.getElementById('prod-price').value),
    img: document.getElementById('prod-img').value.trim(),
    desc: document.getElementById('prod-desc').value.trim()
  };

  products.push(newProd);
  localStorage.setItem('nutmilk_products', JSON.stringify(products));

  closeAddProductModal();
  renderAdminDashboard();
  renderProducts();
  showToast("Đã thêm món mới thành công!");
}

function deleteProduct(prodId) {
  if (!confirm("Bạn muốn xóa món này khỏi menu?")) return;
  let products = JSON.parse(localStorage.getItem('nutmilk_products')) || [];
  products = products.filter(p => p.id !== prodId);
  localStorage.setItem('nutmilk_products', JSON.stringify(products));
  renderAdminDashboard();
  renderProducts();
  showToast("Đã xóa sản phẩm!");
}
// --- XỬ LÝ ĐIỀU CHỈNH ÂM LƯỢNG NHẠC NỀN YOUTUBE ---
let isMuted = false;
let previousVolume = 50;

// Function điều chỉnh âm lượng (0 - 100)
function changeMusicVolume(val) {
  const musicIframe = document.getElementById('bg-music-iframe');
  const volumeValueText = document.getElementById('volume-value');
  
  if (volumeValueText) {
    volumeValueText.innerText = val + '%';
  }

  if (musicIframe && musicIframe.contentWindow) {
    // Gửi lệnh setVolume đến YouTube API
    musicIframe.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func: 'setVolume',
      args: [parseInt(val)]
    }), '*');
  }

  // Cập nhật icon âm lượng tùy theo mức giá trị
  updateVolumeIcon(val);
}

// Function Bật/Tắt tiếng nhanh (Mute)
function toggleMuteMusic() {
  const volumeSlider = document.getElementById('volume-control');
  if (!volumeSlider) return;

  if (isMuted) {
    // Mở lại tiếng với âm lượng trước đó
    volumeSlider.value = previousVolume;
    changeMusicVolume(previousVolume);
    isMuted = false;
  } else {
    // Tắt tiếng
    previousVolume = volumeSlider.value;
    volumeSlider.value = 0;
    changeMusicVolume(0);
    isMuted = true;
  }
}

// Cập nhật Icon âm lượng sinh động
function updateVolumeIcon(val) {
  const iconElement = document.getElementById('volume-icon');
  if (!iconElement) return;

  if (parseInt(val) === 0) {
    iconElement.setAttribute('data-lucide', 'volume-x');
  } else if (parseInt(val) < 50) {
    iconElement.setAttribute('data-lucide', 'volume-1');
  } else {
    iconElement.setAttribute('data-lucide', 'volume-2');
  }
  
  // Render lại icon Lucide nếu thư viện khả dụng
  if (window.lucide) {
    lucide.createIcons();
  }
}

// Tự động kích hoạt phát nhạc khi người dùng tương tác lần đầu
document.addEventListener('click', function initAudioOnInteraction() {
  const musicIframe = document.getElementById('bg-music-iframe');
  if (musicIframe && musicIframe.contentWindow) {
    musicIframe.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func: 'playVideo',
      args: ''
    }), '*');
  }
  document.removeEventListener('click', initAudioOnInteraction);
}, { once: true });
let isPlaying = true;

// Function Bật / Tạm dừng nhạc
function togglePlayMusic() {
  const musicIframe = document.getElementById('bg-music-iframe');
  const playIcon = document.getElementById('play-icon');
  if (!musicIframe || !musicIframe.contentWindow) return;

  if (isPlaying) {
    // Gửi lệnh tạm dừng nhạc
    musicIframe.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func: 'pauseVideo',
      args: ''
    }), '*');
    isPlaying = false;
    if (playIcon) playIcon.setAttribute('data-lucide', 'play');
  } else {
    // Gửi lệnh tiếp tục phát nhạc
    musicIframe.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func: 'playVideo',
      args: ''
    }), '*');
    isPlaying = true;
    if (playIcon) playIcon.setAttribute('data-lucide', 'pause');
  }

  // Cập nhật lại Icon Lucide
  if (window.lucide) {
    lucide.createIcons();
  }
}