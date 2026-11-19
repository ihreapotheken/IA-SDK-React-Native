#!/usr/bin/env python3
"""
Generates the sample prescriptions the showcase app hands to the SDK in its "From your app" flow: a photo and a PDF of
a statutory health insurance prescription (Muster 16), each marked MUSTER so it can't pass for a real one. Writes them
base64-encoded to example/packages/prescription-upload-showcase/src/sdk/samplePrescriptions.ts.

Usage (needs Pillow):
    python3 scripts/generate-showcase-prescriptions.py
"""

import base64
import io
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT = os.path.join(ROOT, 'example', 'packages', 'prescription-upload-showcase', 'src', 'sdk', 'samplePrescriptions.ts')

WIDTH, HEIGHT = 1480, 1050  # A6 landscape at 254 dpi
PAPER = (251, 226, 233)
LINE = (214, 64, 112)
INK = (34, 38, 64)
LABEL = (196, 52, 98)

FONT_PATHS = [
    '/System/Library/Fonts/Helvetica.ttc',
    '/Library/Fonts/Arial.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
]
MONO_PATHS = [
    '/System/Library/Fonts/Courier.ttc',
    '/Library/Fonts/Courier New.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',
]


def font(paths, size):
    for path in paths:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def labelled_box(draw, box, label, small):
    draw.rectangle(box, outline=LINE, width=3)
    draw.text((box[0] + 10, box[1] + 6), label, font=small, fill=LABEL)


def prescription(medications, date):
    image = Image.new('RGB', (WIDTH, HEIGHT), PAPER)
    draw = ImageDraw.Draw(image)
    small = font(FONT_PATHS, 22)
    label = font(FONT_PATHS, 26)
    typed = font(MONO_PATHS, 34)
    typed_large = font(MONO_PATHS, 38)

    # Left column: fee boxes.
    for index, text in enumerate(['Gebühr frei', 'Geb.-pfl.', 'noctu', 'Sonstige', 'Unfall', 'Arbeitsunfall']):
        top = 40 + index * 62
        draw.rectangle((40, top, 80, top + 40), outline=LINE, width=3)
        draw.text((92, top + 6), text, font=label, fill=LABEL)
    draw.text((49, 42), 'X', font=typed, fill=INK)

    # Insurance and patient.
    labelled_box(draw, (300, 40, 960, 120), 'Krankenkasse bzw. Kostenträger', small)
    draw.text((320, 72), 'Muster BKK', font=typed, fill=INK)
    labelled_box(draw, (300, 120, 960, 260), 'Name, Vorname des Versicherten', small)
    draw.text((320, 152), 'Mustermann, Max', font=typed_large, fill=INK)
    draw.text((320, 204), 'Musterweg 7, 10115 Berlin', font=font(MONO_PATHS, 30), fill=INK)
    draw.text((785, 132), 'geb. am', font=small, fill=LABEL)
    draw.text((785, 158), '01.01.80', font=typed, fill=INK)

    cells = [
        ((300, 260, 520, 330), 'Kostenträgerkennung', '109999999'),
        ((520, 260, 760, 330), 'Versicherten-Nr.', 'A123456789'),
        ((760, 260, 960, 330), 'Status', '1000000'),
        ((300, 330, 520, 400), 'Betriebsstätten-Nr.', '123456700'),
        ((520, 330, 760, 400), 'Arzt-Nr.', '987654321'),
        ((760, 330, 960, 400), 'Datum', date),
    ]
    for box, text, value in cells:
        labelled_box(draw, box, text, small)
        draw.text((box[0] + 12, box[1] + 30), value, font=typed, fill=INK)

    # Doctor's stamp.
    labelled_box(draw, (1000, 40, 1440, 400), 'Vertragsarztstempel', small)
    for index, text in enumerate(['Dr. med. Erika Musterfrau', 'Fachärztin für Dermatologie', 'Musterstraße 1', '10115 Berlin', 'Tel. 030 1234567']):
        draw.text((1024, 90 + index * 48), text, font=label if index else font(FONT_PATHS, 30), fill=INK)

    # Medications.
    draw.text((40, 440), 'Rp.', font=font(FONT_PATHS, 48), fill=LABEL)
    draw.text((130, 456), '(Bitte Leerräume durchstreichen)', font=small, fill=LABEL)
    for index, (name, dose) in enumerate(medications):
        top = 530 + index * 110
        draw.line((40, top + 80, 960, top + 80), fill=LINE, width=2)
        draw.text((60, top), name, font=typed_large, fill=INK)
        draw.text((60, top + 44), dose, font=typed, fill=INK)
    bottom = 530 + len(medications) * 110
    draw.line((60, bottom + 10, 940, min(bottom + 160, 960)), fill=INK, width=3)

    # Signature.
    draw.line((1000, 900, 1440, 900), fill=LINE, width=2)
    draw.text((1000, 910), 'Unterschrift des Arztes', font=small, fill=LABEL)
    signature = [(1030, 870), (1070, 820), (1100, 880), (1150, 815), (1185, 875), (1240, 830), (1300, 860), (1380, 840)]
    draw.line(signature, fill=INK, width=4, joint='curve')
    draw.text((40, 990), 'Muster 16 (10.2014)', font=small, fill=LABEL)

    # Watermark.
    watermark = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    ImageDraw.Draw(watermark).text(
        (WIDTH / 2, HEIGHT / 2), 'MUSTER', font=font(FONT_PATHS, 300), fill=(120, 120, 140, 70), anchor='mm'
    )
    image = Image.alpha_composite(image.convert('RGBA'), watermark.rotate(18, resample=Image.BICUBIC))
    return image.convert('RGB')


def encode(image, file_format, **options):
    buffer = io.BytesIO()
    image.save(buffer, file_format, **options)
    return base64.b64encode(buffer.getvalue()).decode('ascii')


photo = prescription(
    [('Mometasonfuroat Creme 0,1 %', '50 g, N2 · 1 x tägl. dünn auftragen'), ('Ibuprofen 400 mg Filmtabletten', '20 St., N1 · bei Bedarf 1 Tbl.')],
    '19.11.26',
)
pdf = prescription([('Doxycyclin 100 mg Tabletten', '28 St., N2 · 1-0-0')], '19.11.26')

with open(OUTPUT, 'w') as file:
    file.write('// Generated by scripts/generate-showcase-prescriptions.py, do not edit.\n')
    file.write('// Sample prescriptions marked MUSTER, which the showcase hands to the SDK as the host app.\n\n')
    file.write(f"/** A photo of a sample paper prescription (JPEG). */\nexport const samplePrescriptionPhoto =\n  '{encode(photo, 'JPEG', quality=82)}';\n\n")
    file.write(f"/** A sample prescription as a PDF. */\nexport const samplePrescriptionPdf =\n  '{encode(pdf, 'PDF', resolution=254)}';\n")

print(f'Wrote {os.path.relpath(OUTPUT, ROOT)} ({os.path.getsize(OUTPUT) // 1024} KB)')
