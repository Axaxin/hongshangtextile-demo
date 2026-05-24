export function validateInquiry(data) {
  const errors = [];
  if (!data.name?.trim()) {
    errors.push('Name is required');
  }
  if (!data.email?.trim()) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.push('Invalid email format');
  }
  return errors;
}

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }

    let data;
    try {
      data = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const errors = validateInquiry(data);
    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: errors.join('; ') }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const key = `inquiry:${Date.now()}-${crypto.randomUUID()}`;
    const entry = {
      name: data.name,
      company: data.company || '',
      email: data.email,
      whatsapp: data.whatsapp || '',
      products: data.products || '',
      note: data.note || '',
      timestamp: new Date().toISOString(),
    };

    await env.INQUIRIES.put(key, JSON.stringify(entry));

    // Send notification email via MailChannels (non-fatal if it fails)
    try {
      const emailBody = [
        `姓名: ${entry.name}`,
        `公司: ${entry.company || '-'}`,
        `邮箱: ${entry.email}`,
        `WhatsApp: ${entry.whatsapp || '-'}`,
        `产品意向: ${entry.products || '-'}`,
        `备注: ${entry.note || '-'}`,
        `时间: ${entry.timestamp}`,
      ].join('\n');

      await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: env.NOTIFY_EMAIL }] }],
          from: { email: env.NOTIFY_FROM, name: '鸿尚纺织网站' },
          subject: `新询盘 — ${entry.name}${entry.company ? ` (${entry.company})` : ''}`,
          content: [{ type: 'text/plain', value: emailBody }],
        }),
      });
    } catch {
      // Email failure is non-fatal — inquiry already persisted in KV
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  },
};
