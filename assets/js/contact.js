export function validateContactForm(data) {
  const errors = {};
  if (!data.name?.trim()) {
    errors.name = '请填写您的姓名';
  }
  if (!data.email?.trim()) {
    errors.email = '请填写邮箱地址';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = '邮箱格式不正确';
  }
  return errors;
}

if (typeof document !== 'undefined') {
  const form = document.getElementById('inquiry-form');
  if (form) {

  const successEl = document.getElementById('form-success');

  function showFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errEl = document.getElementById(`${fieldId}-error`);
    if (input) input.classList.add('error');
    if (errEl) { errEl.textContent = message; errEl.classList.add('visible'); }
  }

  function clearErrors() {
    form.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));
    form.querySelectorAll('.form-error').forEach(el => { el.textContent = ''; el.classList.remove('visible'); });
  }

  const params = new URLSearchParams(location.search);
  const productParam = params.get('product');
  if (productParam) {
    const productsEl = document.getElementById('products');
    if (productsEl) productsEl.value = productParam;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    clearErrors();

    const data = {
      name: form.name.value,
      company: form.company.value,
      email: form.email.value,
      whatsapp: form.whatsapp.value,
      products: form.products.value,
      note: form.note.value,
    };

    const errors = validateContactForm(data);
    if (Object.keys(errors).length > 0) {
      if (errors.name) showFieldError('name', errors.name);
      if (errors.email) showFieldError('email', errors.email);
      return;
    }

    const submitBtn = form.querySelector('[type=submit]');
    submitBtn.disabled = true;
    submitBtn.textContent = '发送中...';

    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        form.style.display = 'none';
        successEl.classList.add('visible');
      } else {
        let msg = '提交失败，请稍后再试';
        try { const j = await res.json(); msg = j.error || msg; } catch {}
        alert(msg);
        submitBtn.disabled = false;
        submitBtn.textContent = '发送询盘';
      }
    } catch {
      alert('网络错误，请检查连接后重试');
      submitBtn.disabled = false;
      submitBtn.textContent = '发送询盘';
    }
  });
  } // end if (form)
} // end if (typeof document !== 'undefined')
