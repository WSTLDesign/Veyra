# Nutzung: python3 tools/artsplit.py <bild.png> name1 name2 name3   (Dreier-Streifen auf Weiß → public/art/<name>.webp)
import sys; from PIL import Image; import numpy as np
im=Image.open(sys.argv[1]).convert('RGBA');a=np.array(im);names=sys.argv[2:]
rgb=a[:,:,:3].astype(int);mask=(np.abs(rgb-255).sum(2)>45);cols=mask.sum(0)>3;w=len(cols)
segs=[];inseg=False
for x in range(w):
  if cols[x] and not inseg: s=x;inseg=True
  if not cols[x] and inseg:
    if x-s>40: segs.append((s,x))
    inseg=False
if inseg: segs.append((s,w))
while len(segs)>len(names):
  i=min(range(len(segs)),key=lambda i:segs[i][1]-segs[i][0])
  j=i-1 if i>0 and (i==len(segs)-1 or segs[i][0]-segs[i-1][1]<segs[i+1][0]-segs[i][1]) else i+1
  lo,hi=min(i,j),max(i,j);segs[lo:hi+1]=[(segs[lo][0],segs[hi][1])]
ink=mask.sum(0)
while len(segs)<len(names):
  i=max(range(len(segs)),key=lambda i:segs[i][1]-segs[i][0]);s0,e0=segs[i];lo=s0+(e0-s0)//4;hi=e0-(e0-s0)//4
  x=lo+int(np.argmin(ink[lo:hi]));segs[i:i+1]=[(s0,x),(x,e0)]
dist=np.abs(rgb-255).sum(2);a[:,:,3]=np.minimum(a[:,:,3],np.clip((dist-15)*6,0,255).astype(np.uint8))
full=Image.fromarray(a)
for (s,e),n in zip(segs,names):
  c=full.crop((max(0,s-8),0,min(w,e+8),im.height));c=c.crop(c.getbbox());c.thumbnail((512,512),Image.LANCZOS)
  c.save(f'public/art/{n}.webp','WEBP',quality=82,method=6)
print(sys.argv[1].split('/')[-1],segs,names)
