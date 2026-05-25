import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    addDoc,
    writeBatch,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyBBB8xDItXy26YVzhO3YbHitQ1AGbo-jZI",
  authDomain: "tienditadigital.firebaseapp.com",
  projectId: "tienditadigital",
  storageBucket: "tienditadigital.firebasestorage.app",
  messagingSenderId: "460711647500",
  appId: "1:460711647500:web:6f24dc5ccd31baf5001129"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


let PRODUCTOS = [];
let carrito = [];
let unsubscribeProductos = null;


onAuthStateChanged(auth, (user) => {
    const loginView = document.getElementById('login-view');
    const shopView = document.getElementById('shop-view');

    if (user) {
        
        if (loginView) loginView.classList.add('hidden');
        if (shopView) shopView.classList.remove('hidden');
        escucharProductosTienda();
    } else {
        
        if (unsubscribeProductos) {
            unsubscribeProductos();
            unsubscribeProductos = null;
        }
        if (shopView) shopView.classList.add('hidden');
        if (loginView) loginView.classList.remove('hidden');
        PRODUCTOS = [];
        carrito = [];
        updateCartUI();
    }
});


function escucharProductosTienda() {
    if (unsubscribeProductos) unsubscribeProductos();

    unsubscribeProductos = onSnapshot(collection(db, "productos"), (querySnapshot) => {
        PRODUCTOS = [];
        querySnapshot.forEach((docSnap) => {
            const producto = docSnap.data();
            const stockDisponible = producto.stock !== undefined ? parseInt(producto.stock) : 0;

            PRODUCTOS.push({
                id: docSnap.id,
                name: producto.name || "Producto sin nombre",
                price: parseFloat(producto.price) || 0,
                desc: producto.desc || "",
                icon: producto.icon || "fa-box",
                stock: stockDisponible
            });
        });
        renderProducts();
    }, (error) => {
        console.error("Error al sincronizar inventario: ", error);
    });
}


window.toggleAuthMode = toggleAuthMode;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;

function toggleAuthMode(event, mode) {
    if (event) event.preventDefault();
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const footerLogin = document.getElementById('auth-footer-login');
    const footerRegister = document.getElementById('auth-footer-register');
    const messageText = document.getElementById('auth-message-text');

    if (mode === 'register') {
        if (loginForm) loginForm.classList.add('hidden');
        if (footerLogin) footerLogin.classList.add('hidden');
        if (registerForm) registerForm.classList.remove('hidden');
        if (footerRegister) footerRegister.classList.remove('hidden');
        if (messageText) messageText.innerText = "Regístrate de forma rápida para empezar a llenar tu canasta virtual.";
    } else {
        if (registerForm) registerForm.classList.add('hidden');
        if (footerRegister) footerRegister.classList.add('hidden');
        if (loginForm) loginForm.classList.remove('hidden');
        if (footerLogin) footerLogin.classList.remove('hidden');
        if (messageText) messageText.innerText = "¡Qué bueno verte! Inicia sesión para hacer tu mandado del día.";
    }
}

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
        .catch((error) => {
            console.error(error);
            alert("El correo o la contraseña no son correctos.");
        });
}

function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim().toLowerCase();
    const password = document.getElementById('register-password').value;

    let userCreated = null;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            userCreated = userCredential.user;
            return updateProfile(userCreated, { displayName: name });
        })
        .then(() => {
            
            return setDoc(doc(db, "usuarios", userCreated.uid), {
                nombre: name,
                correo: email
            });
        })
        .then(() => {
            alert("Cuenta creada con éxito. ¡Bienvenido!");
        })
        .catch((error) => {
            console.error(error);
            alert(`Error al registrarse: ${error.message}`);
        });
}

function handleLogout() {
    signOut(auth).then(() => {
        carrito = [];
        updateCartUI();
    }).catch((error) => {
        console.error("Error al cerrar sesión: ", error);
    });
}


window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.toggleCart = toggleCart;
window.checkout = checkout;
window.closeTicketModal = closeTicketModal;
window.downloadTicket = downloadTicket;

function renderProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (PRODUCTOS.length === 0) {
        grid.innerHTML = `
            <div class="empty-products">
                <h2>No hay productos disponibles por el momento</h2>
            </div>
        `;
        return;
    }

    PRODUCTOS.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'product-card';
        const tieneStock = prod.stock > 0;
        
        card.innerHTML = `
            <div class="product-img">
                <i class="fa-solid ${prod.icon}"></i>
            </div>
            <div class="product-info">
                <h3>${prod.name}</h3>
                <p class="product-desc">${prod.desc}</p>
                <p class="product-stock-status">
                    ${tieneStock ? `Disponibles: <strong>${prod.stock} pzas</strong>` : '<span style="color:red; font-weight:bold;">Agotado temporalmente</span>'}
                </p>
                <div class="product-meta">
                    <span class="product-price">$${prod.price.toFixed(2)}</span>
                    ${tieneStock ? `
                        <button class="btn-add-cart" onclick="addToCart('${prod.id}')" title="Agregar a la canasta">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    ` : `
                        <button class="btn-add-cart" disabled style="background-color: #ccc; cursor: not-allowed;">
                            <i class="fa-solid fa-ban"></i>
                        </button>
                    `}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('show');
}

function addToCart(id) {
    const producto = PRODUCTOS.find(p => p.id === id);
    if (!producto) return;

    const itemEnCarrito = carrito.find(item => item.id === id);
    const cantidadActualEnCarrito = itemEnCarrito ? itemEnCarrito.qty : 0;

    if (cantidadActualEnCarrito >= producto.stock) {
        alert(`Disculpa, solo tenemos ${producto.stock} unidades de "${producto.name}" en existencia.`);
        return;
    }

    if (itemEnCarrito) {
        itemEnCarrito.qty++;
    } else {
        carrito.push({ ...producto, qty: 1 });
    }
    updateCartUI();
}

function removeFromCart(id) {
    carrito = carrito.filter(item => item.id !== id);
    updateCartUI();
}

function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCountBadge = document.getElementById('cart-count');
    const cartTotalAmount = document.getElementById('cart-total-amount');

    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = '';

    if (carrito.length === 0) {
        cartItemsContainer.innerHTML = `<p class="empty-cart-msg">Tu canasta está vacía. ¡Llévate algo rico!</p>`;
        if (cartCountBadge) cartCountBadge.innerText = '0';
        if (cartTotalAmount) cartTotalAmount.innerText = '$0.00';
        return;
    }

    let total = 0;
    let totalCount = 0;

    carrito.forEach(item => {
        total += item.price * item.qty;
        totalCount += item.qty;

        const itemRow = document.createElement('div');
        itemRow.className = 'cart-item';
        itemRow.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>$${item.price.toFixed(2)} x ${item.qty}</p>
            </div>
            <div class="cart-item-qty">
                <span>$${(item.price * item.qty).toFixed(2)}</span>
                <button class="remove-item" onclick="removeFromCart('${item.id}')">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;
        cartItemsContainer.appendChild(itemRow);
    });

    if (cartCountBadge) cartCountBadge.innerText = totalCount;
    if (cartTotalAmount) cartTotalAmount.innerText = `$${total.toFixed(2)}`;
}

async function checkout() {
    if (carrito.length === 0) {
        alert('Aún no tienes productos en tu canasta.');
        return;
    }

    const batch = writeBatch(db);
    let totalVenta = 0;
    const detallesProductos = [];

    for (const item of carrito) {
        const prodOriginal = PRODUCTOS.find(p => p.id === item.id);
        if (!prodOriginal || prodOriginal.stock < item.qty) {
            alert(`Hubo un cambio en el inventario. El producto "${item.name}" ya no cuenta con las piezas suficientes.`);
            return;
        }
        
        totalVenta += item.price * item.qty;
        const nuevoStock = prodOriginal.stock - item.qty;
        const documentoRef = doc(db, "productos", item.id);
        
        batch.update(documentoRef, { stock: nuevoStock });

        detallesProductos.push({
            id: item.id,
            name: item.name,
            qty: item.qty,
            price: item.price,
            subtotal: item.price * item.qty
        });
    }

    try {
        await batch.commit();

        const usuarioActual = auth.currentUser;
        await addDoc(collection(db, "ganancias"), {
            fecha: new Date(),
            clienteEmail: usuarioActual ? usuarioActual.email : "Anonimo",
            clienteNombre: usuarioActual && usuarioActual.displayName ? usuarioActual.displayName : "Vecino de la Esquina",
            total: totalVenta,
            productos: detallesProductos
        });

        const dateSpan = document.getElementById('ticket-date');
        const idSpan = document.getElementById('ticket-id');
        const clientSpan = document.getElementById('ticket-client-name');
        const productsList = document.getElementById('ticket-products-list');
        const totalVal = document.getElementById('ticket-total-val');
        
        const ahora = new Date();
        if (dateSpan) dateSpan.innerText = ahora.toLocaleDateString() + ' ' + ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (idSpan) idSpan.innerText = Math.floor(100000 + Math.random() * 900000);
        if (clientSpan) clientSpan.innerText = usuarioActual && usuarioActual.displayName ? usuarioActual.displayName : "Vecino Frecuente";

        if (productsList) {
            productsList.innerHTML = '';
            detallesProductos.forEach(item => {
                const prodRow = document.createElement('div');
                prodRow.className = 'ticket-prod-item';
                prodRow.style.display = 'flex';
                prodRow.style.justifyContent = 'space-between';
                prodRow.style.marginBottom = '0.4rem';
                prodRow.innerHTML = `
                    <span>${item.qty}x  ${item.name.substring(0, 22)}</span>
                    <strong>$${item.subtotal.toFixed(2)}</strong>
                `;
                productsList.appendChild(prodRow);
            });
        }

        if (totalVal) totalVal.innerText = `$${totalVenta.toFixed(2)}`;

        const sidebar = document.getElementById('cart-sidebar');
        if (sidebar && sidebar.classList.contains('open')) {
            toggleCart();
        }
        
        const modal = document.getElementById('ticket-modal');
        if (modal) modal.classList.add('open');

    } catch (error) {
        console.error("Error al procesar la compra: ", error);
        alert("Ocurrió un error inesperado al procesar tu pedido. Inténtalo de nuevo.");
    }
}

function closeTicketModal() {
    const modal = document.getElementById('ticket-modal');
    if (modal) modal.classList.remove('open');
    carrito = [];
    updateCartUI();
}

function downloadTicket() {
    window.print();
}
