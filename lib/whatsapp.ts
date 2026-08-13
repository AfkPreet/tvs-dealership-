import { dealer } from '@/content/dealer';

export type Locale = 'en' | 'hi';

export type EnquiryKind = 'testRide' | 'price' | 'finance' | 'service' | 'general';

export type EnquiryPayload = {
  kind: EnquiryKind;
  name?: string;
  phone?: string;
  model?: string;
  date?: string;
  serviceType?: string;
  /** The page the enquiry came from, e.g. "/vehicles/jupiter-125". */
  sourcePath: string;
  locale: Locale;
};

/**
 * The prefilled WhatsApp body. It names the model and the page the enquiry came
 * from, so whoever picks up the phone in the showroom has the context without
 * having to ask for it again.
 */
export function buildMessage(p: EnquiryPayload): string {
  const model = p.model?.trim();
  const name = p.name?.trim();
  const page = `${dealer.siteUrl}${p.sourcePath}`;

  if (p.locale === 'hi') {
    const lines: string[] = [];
    switch (p.kind) {
      case 'testRide':
        lines.push(`नमस्ते, मुझे ${model ?? 'एक TVS गाड़ी'} की test ride लेनी है।`);
        break;
      case 'price':
        lines.push(`नमस्ते, मुझे ${model ?? 'एक TVS गाड़ी'} का on-road price चाहिए।`);
        break;
      case 'finance':
        lines.push(`नमस्ते, मुझे ${model ?? 'एक TVS गाड़ी'} के लिए finance और EMI की जानकारी चाहिए।`);
        break;
      case 'service':
        lines.push(`नमस्ते, मुझे अपनी ${model ?? 'TVS गाड़ी'} की service बुक करानी है।`);
        if (p.serviceType) lines.push(`Service: ${p.serviceType}`);
        if (p.date) lines.push(`तारीख़: ${p.date}`);
        break;
      default:
        lines.push(`नमस्ते, मुझे ${model ?? 'TVS गाड़ियों'} के बारे में जानकारी चाहिए।`);
    }
    if (name) lines.push(`नाम: ${name}`);
    if (p.phone) lines.push(`मोबाइल: ${p.phone}`);
    lines.push(`यह मैंने आपकी वेबसाइट पर देखा: ${page}`);
    return lines.join('\n');
  }

  const lines: string[] = [];
  switch (p.kind) {
    case 'testRide':
      lines.push(`Namaste, I would like to book a test ride for the ${model ?? 'TVS range'}.`);
      break;
    case 'price':
      lines.push(`Namaste, I am interested in the ${model ?? 'TVS range'}. Please send me the on-road price.`);
      break;
    case 'finance':
      lines.push(`Namaste, I would like finance and EMI details for the ${model ?? 'TVS range'}.`);
      break;
    case 'service':
      lines.push(`Namaste, I would like to book a service for my ${model ?? 'TVS vehicle'}.`);
      if (p.serviceType) lines.push(`Service type: ${p.serviceType}`);
      if (p.date) lines.push(`Preferred date: ${p.date}`);
      break;
    default:
      lines.push(`Namaste, I would like to know more about the ${model ?? 'TVS range'}.`);
  }
  if (name) lines.push(`Name: ${name}`);
  if (p.phone) lines.push(`Mobile: ${p.phone}`);
  lines.push(`I saw this on your website: ${page}`);
  return lines.join('\n');
}

export function whatsappLink(p: EnquiryPayload): string {
  return `https://wa.me/${dealer.whatsapp}?text=${encodeURIComponent(buildMessage(p))}`;
}

export const telLink = `tel:+${dealer.phone}`;
