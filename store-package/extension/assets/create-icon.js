// Run this in your browser console to generate base64 icons
function generateIcon(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.fillStyle = '#0a66c2';
    ctx.fillRect(0, 0, size, size);

    // Draw text
    ctx.fillStyle = 'white';
    ctx.font = `${size * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔥', size/2, size/2);

    return canvas.toDataURL('image/png');
}

// Generate both sizes
const icon48 = generateIcon(48);
const icon128 = generateIcon(128);

console.log('48px Icon:', icon48);
console.log('128px Icon:', icon128); 