import QRCode from 'qrcode'

export async function generateQRDataURL(data: string, size = 200): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      width: size,
      margin: 2,
      color: {
        dark: '#050510',
        light: '#e8c547'
      },
      errorCorrectionLevel: 'M'
    })
  } catch (err) {
    console.error('QR generation failed', err)
    return ''
  }
}

export async function generateQRCanvas(data: string, canvas: HTMLCanvasElement) {
  await QRCode.toCanvas(canvas, data, {
    width: 200,
    margin: 2,
    color: { dark: '#050510', light: '#e8c547' }
  })
}
