from pdf2image import convert_from_path
from pathlib import Path

def main():
    pdf_path = Path('./gpt4-image-api/phy2049_f2019_exam2 (1).pdf')
    save_path = Path('images')
    images = convert_from_path(pdf_path, poppler_path=r'C:\Users\lukea\Downloads\Release-23.08.0-0\poppler-23.08.0'
                                                      r'\Library\bin')
    for num, image in enumerate(images, start=1):
        image.save(save_path / f'image{num}.jpg', 'JPEG')

if __name__ == '__main__':
    main()
