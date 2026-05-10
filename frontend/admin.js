const ADMIN_PIN = '1234'; // Change this to your PIN

function initAdmin() {
  const pinWall      = document.getElementById('pin-wall');
  const pinInput     = document.getElementById('pin-input');
  const pinError     = document.getElementById('pin-error');
  const adminContent = document.getElementById('admin-content');

  function tryPin() {
    if (pinInput.value === ADMIN_PIN) {
      pinWall.hidden      = true;
      adminContent.hidden = false;
      pinError.textContent = '';
    } else {
      pinError.textContent = 'Incorrect PIN.';
      pinInput.value = '';
      pinInput.focus();
    }
  }

  document.getElementById('pin-submit').addEventListener('click', tryPin);
  pinInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') tryPin();
  });
}

document.addEventListener('DOMContentLoaded', initAdmin);
