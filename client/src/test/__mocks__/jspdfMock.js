function jsPDF() {
  return {
    setFontSize() {},
    text() {},
    splitTextToSize: (text) => [String(text)],
    addPage() {},
    save() {},
  };
}

module.exports = { jsPDF };
