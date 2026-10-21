from PIL import Image
import base64
import re
import os

im = Image.open('logo_strip.png')
# crop away the black pillars on the sides
clean = im.crop((4, 0, 724, 70))
highres = clean.resize((1440, 140), Image.Resampling.LANCZOS)
highres.save('logo_strip_clean_crop.png')

with open('logo_strip_clean_crop.png', 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('utf-8')
data_uri = f'data:image/png;base64,{b64}'

with open('poster.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'src="data:image/png;base64,[^"]+"', f'src="{data_uri}"', content)

with open('poster.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated poster.html with clean cropped logo strip!')
