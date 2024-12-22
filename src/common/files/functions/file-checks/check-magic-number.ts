import magicBytes from 'magic-bytes.js';

export function checkMagicNumber(file: Express.Multer.File): boolean {
  const detectedSignatures = magicBytes(file.buffer).map(
    (detectedFile) => detectedFile.mime,
  );

  if (!detectedSignatures.length) return false;

  const detectedSubtypes = detectedSignatures.map(
    (signature) => signature.split('/')[1],
  );

  const fileSubtype = file.mimetype.split('/')[1];

  return detectedSubtypes.includes(fileSubtype);
}
