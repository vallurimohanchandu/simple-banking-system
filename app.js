// --- Data Structures ---
const users = new Map();
users.set('admin', { password: 'admin', accounts: new Map() });
let currentUser = null;
let currentTab = 'accounts';

// --- Utility Functions ---
function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.background = type === 'error' ? 'var(--danger)' : (type === 'success' ? 'var(--success)' : 'var(--primary)');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}
function openModal(html) {
  document.getElementById('modalContent').innerHTML = html;
  document.getElementById('modalBg').classList.add('active');
}
function closeModal() {
  document.getElementById('modalBg').classList.remove('active');
}
document.getElementById('closeModal').onclick = closeModal;
document.getElementById('modalBg').onclick = function(e) {
  if (e.target === this) closeModal();
};

// --- Login/Register UI ---
document.getElementById('showRegisterBtn').onclick = function() {
  document.getElementById('loginCard').style.display = 'none';
  document.getElementById('registerCard').style.display = '';
};
document.getElementById('showLoginBtn').onclick = function() {
  document.getElementById('registerCard').style.display = 'none';
  document.getElementById('loginCard').style.display = '';
};

// --- Login Logic ---
document.getElementById('loginForm').onsubmit = function(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!users.has(username)) {
    showToast('User not found', 'error');
    return;
  }
  if (users.get(username).password !== password) {
    showToast('Incorrect password', 'error');
    return;
  }
  currentUser = username;
  showDashboard();
  this.reset();
};
document.getElementById('registerForm').onsubmit = function(e) {
  e.preventDefault();
  const username = document.getElementById('registerUsername').value.trim();
  const password = document.getElementById('registerPassword').value;
  if (!username || !password) {
    showToast('Please fill all fields', 'error');
    return;
  }
  if (users.has(username)) {
    showToast('Username already exists', 'error');
    return;
  }
  users.set(username, { password, accounts: new Map() });
  showToast('Registration successful! You can now login.', 'success');
  document.getElementById('registerCard').style.display = 'none';
  document.getElementById('loginCard').style.display = '';
  this.reset();
};
document.getElementById('logoutBtn').onclick = function() {
  currentUser = null;
  document.getElementById('dashboardCard').style.display = 'none';
  document.getElementById('navbar').style.display = 'none';
  document.getElementById('loginCard').style.display = '';
};

// --- Dashboard UI ---
function showDashboard() {
  document.getElementById('loginCard').style.display = 'none';
  document.getElementById('registerCard').style.display = 'none';
  document.getElementById('dashboardCard').style.display = '';
  document.getElementById('navbar').style.display = '';
  document.getElementById('navUser').textContent = currentUser;
  switchTab('accounts');
  renderAccountsTable();
  renderTransactionsTable();
  renderFilterAccountOptions();
}
// --- Tabs ---
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.onclick = function() {
    switchTab(this.dataset.tab);
  };
});
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector('.tab-btn[data-tab="' + tab + '"]').classList.add('active');
  document.querySelectorAll('.tab-section').forEach(sec => sec.style.display = 'none');
  document.getElementById('tab-' + tab).style.display = '';
  if (tab === 'accounts') renderAccountsTable();
  if (tab === 'transactions') renderTransactionsTable();
  if (tab === 'transactions') renderFilterAccountOptions();
}

// --- Accounts Table ---
function renderAccountsTable() {
  const accounts = users.get(currentUser).accounts;
  const tbody = document.querySelector('#accountsTable tbody');
  tbody.innerHTML = '';
  if (accounts.size === 0) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#888;">No accounts yet.</td></tr>';
    return;
  }
  for (let acc of Array.from(accounts.values()).sort((a,b)=>b.balance-a.balance)) {
    tbody.innerHTML += `<tr><td>${acc.accountNumber}</td><td>${acc.name}</td><td>₹${acc.balance.toFixed(2)}</td></tr>`;
  }
}
// --- Transactions Table ---
function renderTransactionsTable() {
  const accounts = users.get(currentUser).accounts;
  const filterAcc = document.getElementById('filterAccount').value;
  let allTx = [];
  for (let acc of accounts.values()) {
    for (let t of acc.transactions) {
      allTx.push({ ...t, accountNumber: acc.accountNumber });
    }
  }
  if (filterAcc) allTx = allTx.filter(t => t.accountNumber === filterAcc);
  allTx.sort((a,b)=>new Date(b.date)-new Date(a.date));
  const tbody = document.querySelector('#transactionsTable tbody');
  tbody.innerHTML = '';
  if (allTx.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#888;">No transactions yet.</td></tr>';
    return;
  }
  for (let t of allTx) {
    tbody.innerHTML += `<tr><td>${t.date}</td><td>${t.accountNumber}</td><td>${t.type}</td><td>₹${t.amount.toFixed(2)}</td></tr>`;
  }
}
function renderFilterAccountOptions() {
  const sel = document.getElementById('filterAccount');
  const accounts = users.get(currentUser).accounts;
  sel.innerHTML = '<option value="">All</option>';
  for (let acc of accounts.values()) {
    sel.innerHTML += `<option value="${acc.accountNumber}">${acc.accountNumber} - ${acc.name}</option>`;
  }
}
document.getElementById('filterAccount').onchange = renderTransactionsTable;

// --- Modal Forms ---
document.getElementById('openCreateAccountModal').onclick = function() {
  openModal(`
    <h2 style='margin-top:0;'>Create New Account</h2>
    <form id='modalCreateAccount'>
      <label>Name</label>
      <input type='text' id='modalAccName' required>
      <label>Account Number</label>
      <input type='text' id='modalAccNumber' required>
      <label>Initial Balance</label>
      <input type='number' id='modalAccInitBal' min='0' value='0' required>
      <button type='submit' style='width:100%;margin-top:1rem;'>Create</button>
    </form>
  `);
  document.getElementById('modalCreateAccount').onsubmit = function(e) {
    e.preventDefault();
    const name = document.getElementById('modalAccName').value.trim();
    const accountNumber = document.getElementById('modalAccNumber').value.trim();
    const initialBalance = parseFloat(document.getElementById('modalAccInitBal').value);
    if (!name || !accountNumber || isNaN(initialBalance) || initialBalance < 0) {
      showToast('Invalid input', 'error');
      return;
    }
    const accounts = users.get(currentUser).accounts;
    if (accounts.has(accountNumber)) {
      showToast('Account number already exists', 'error');
      return;
    }
    accounts.set(accountNumber, {
      name,
      accountNumber,
      balance: initialBalance,
      transactions: [{ type: 'Account Created', amount: initialBalance, date: new Date().toLocaleString() }]
    });
    showToast('Account created!', 'success');
    closeModal();
    renderAccountsTable();
    renderFilterAccountOptions();
  };
};
document.getElementById('openDepositModal').onclick = function() {
  openModal(`
    <h2 style='margin-top:0;'>Deposit Money</h2>
    <form id='modalDeposit'>
      <label>Account Number</label>
      <input type='text' id='modalDepAcc' required>
      <label>Amount</label>
      <input type='number' id='modalDepAmt' min='0.01' step='0.01' required>
      <button type='submit' style='width:100%;margin-top:1rem;'>Deposit</button>
    </form>
  `);
  document.getElementById('modalDeposit').onsubmit = function(e) {
    e.preventDefault();
    const accNum = document.getElementById('modalDepAcc').value.trim();
    const amt = parseFloat(document.getElementById('modalDepAmt').value);
    const acc = users.get(currentUser).accounts.get(accNum);
    if (!acc) {
      showToast('Account not found', 'error');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      showToast('Invalid amount', 'error');
      return;
    }
    acc.balance += amt;
    acc.transactions.push({ type: 'Deposit', amount: amt, date: new Date().toLocaleString() });
    showToast('Deposit successful', 'success');
    closeModal();
    renderAccountsTable();
    renderTransactionsTable();
  };
};
document.getElementById('openWithdrawModal').onclick = function() {
  openModal(`
    <h2 style='margin-top:0;'>Withdraw Money</h2>
    <form id='modalWithdraw'>
      <label>Account Number</label>
      <input type='text' id='modalWAcc' required>
      <label>Amount</label>
      <input type='number' id='modalWAmt' min='0.01' step='0.01' required>
      <button type='submit' style='width:100%;margin-top:1rem;'>Withdraw</button>
    </form>
  `);
  document.getElementById('modalWithdraw').onsubmit = function(e) {
    e.preventDefault();
    const accNum = document.getElementById('modalWAcc').value.trim();
    const amt = parseFloat(document.getElementById('modalWAmt').value);
    const acc = users.get(currentUser).accounts.get(accNum);
    if (!acc) {
      showToast('Account not found', 'error');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      showToast('Invalid amount', 'error');
      return;
    }
    if (amt > acc.balance) {
      showToast('Insufficient funds', 'error');
      return;
    }
    acc.balance -= amt;
    acc.transactions.push({ type: 'Withdraw', amount: amt, date: new Date().toLocaleString() });
    showToast('Withdrawal successful', 'success');
    closeModal();
    renderAccountsTable();
    renderTransactionsTable();
  };
};
document.getElementById('openTransferModal').onclick = function() {
  openModal(`
    <h2 style='margin-top:0;'>Transfer Money</h2>
    <form id='modalTransfer'>
      <label>From Account</label>
      <input type='text' id='modalTFrom' required>
      <label>To Account</label>
      <input type='text' id='modalTTo' required>
      <label>Amount</label>
      <input type='number' id='modalTAmt' min='0.01' step='0.01' required>
      <button type='submit' style='width:100%;margin-top:1rem;'>Transfer</button>
    </form>
  `);
  document.getElementById('modalTransfer').onsubmit = function(e) {
    e.preventDefault();
    const fromAcc = document.getElementById('modalTFrom').value.trim();
    const toAcc = document.getElementById('modalTTo').value.trim();
    const amt = parseFloat(document.getElementById('modalTAmt').value);
    const from = users.get(currentUser).accounts.get(fromAcc);
    const to = users.get(currentUser).accounts.get(toAcc);
    if (!from || !to) {
      showToast('Account not found', 'error');
      return;
    }
    if (fromAcc === toAcc) {
      showToast('Cannot transfer to same account', 'error');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      showToast('Invalid amount', 'error');
      return;
    }
    if (amt > from.balance) {
      showToast('Insufficient funds', 'error');
      return;
    }
    from.balance -= amt;
    to.balance += amt;
    const now = new Date().toLocaleString();
    from.transactions.push({ type: `Transfer Out to ${toAcc}`, amount: amt, date: now });
    to.transactions.push({ type: `Transfer In from ${fromAcc}`, amount: amt, date: now });
    showToast('Transfer successful', 'success');
    closeModal();
    renderAccountsTable();
    renderTransactionsTable();
  };
};
document.getElementById('openBalanceModal').onclick = function() {
  openModal(`
    <h2 style='margin-top:0;'>Check Balance</h2>
    <form id='modalBalance'>
      <label>Account Number</label>
      <input type='text' id='modalBAcc' required>
      <button type='submit' style='width:100%;margin-top:1rem;'>Check</button>
    </form>
    <div id='modalBalanceResult' style='margin-top:1rem;'></div>
  `);
  document.getElementById('modalBalance').onsubmit = function(e) {
    e.preventDefault();
    const accNum = document.getElementById('modalBAcc').value.trim();
    const acc = users.get(currentUser).accounts.get(accNum);
    const res = document.getElementById('modalBalanceResult');
    if (!acc) {
      res.innerHTML = '<span style="color:var(--danger)">Account not found</span>';
      return;
    }
    res.innerHTML = `<span style='color:var(--success)'>${acc.name} (Acc#: ${acc.accountNumber}) Balance: ₹${acc.balance.toFixed(2)}</span>`;
  };
}; 