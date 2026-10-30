import cv2, numpy as np, json
out={}
for n in ['01-front','02-three-quarter','03-aerial','04-front-vertical']:
    base=cv2.imread(f'shots_ai/{n}.png'); ren=cv2.imread(f'renders/{n}.png')
    H,W=base.shape[:2]
    # resize render to base size first (same aspect), then refine with similarity transform
    r0=cv2.resize(ren,(W,H),interpolation=cv2.INTER_CUBIC)
    g1=cv2.cvtColor(base,cv2.COLOR_BGR2GRAY); g2=cv2.cvtColor(r0,cv2.COLOR_BGR2GRAY)
    sift=cv2.SIFT_create(6000); k1,d1=sift.detectAndCompute(g1,None); k2,d2=sift.detectAndCompute(g2,None)
    m=cv2.BFMatcher().knnMatch(d2,d1,k=2); good=[a for a,b in m if a.distance<0.72*b.distance]
    src=np.float32([k2[a.queryIdx].pt for a in good]); dst=np.float32([k1[a.trainIdx].pt for a in good])
    M,inl=cv2.estimateAffinePartial2D(src,dst,method=cv2.RANSAC,ransacReprojThreshold=4)
    s=np.hypot(M[0,0],M[1,0]); print(n,'matches',len(good),'inliers',int(inl.sum()),'scale',round(s,4),'tx',round(M[0,2],1),'ty',round(M[1,2],1))
    warped=cv2.warpAffine(r0,M,(W,H),flags=cv2.INTER_CUBIC,borderMode=cv2.BORDER_REFLECT)
    cv2.imwrite(f'renders/{n}-aligned.png',warped)
    blend=cv2.addWeighted(base,.5,warped,.5,0); cv2.imwrite(f'renders/{n}-check.jpg',cv2.resize(blend,(W//2,H//2)))
    out[n]=M.tolist()
json.dump(out,open('renders/align.json','w'))
