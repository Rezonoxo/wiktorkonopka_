const fs = require('fs');
try {
	const { layout } = JSON.parse(fs.readFileSync('gallery.config.json', 'utf8'));
	if (!layout || !['desktopColumns', 'tabletColumns', 'mobileColumns', 'gap'].every(key => Number.isFinite(layout[key]))) {
		throw new Error('Brakuje prawidłowych ustawień układu galerii.');
	}
	console.log('Konfiguracja galerii jest poprawna.');
} catch (error) {
	console.error(`Nieprawidłowa konfiguracja: ${error.message}`);
	process.exit(1);
}
