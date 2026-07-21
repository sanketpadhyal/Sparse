import React, { useState } from "react";
import Cropper from "react-easy-crop";
import "./ProfilePhotoCropper.css";

function ProfilePhotoCropper({ image, onCancel, onComplete }) {

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const createImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });

  const getCroppedImg = async () => {

    if (!croppedAreaPixels) return;

    setProcessing(true);

    const img = await createImage(image);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const size = 300;

    canvas.width = size;
    canvas.height = size;

    ctx.drawImage(
      img,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      size,
      size
    );

    const base64 = canvas.toDataURL("image/jpeg", 0.5);

    setProcessing(false);

    onComplete(base64);

  };

  return (

    <div className="cropper-overlay">

<div className="cropper-modal">

<div className="cropper-header">
<h3>Adjust profile photo</h3>
<p>Drag and zoom to fit the circle</p>
</div>

<div className="cropper-area">

<Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            zoomSpeed={0.5}
            objectFit="cover"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete} />
          

</div>

<div className="cropper-controls">

<div className="zoom-control">

<label>Zoom</label>

<input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(e.target.value)} />
            

</div>

<div className="cropper-buttons">

<button
              className="cancel-btn"
              onClick={onCancel}>
              
Cancel
</button>

<button
              className="select-btn"
              onClick={getCroppedImg}
              disabled={processing}>
              
{processing ? "Processing..." : "Use Photo"}
</button>

</div>

</div>

</div>

</div>);



}

export default ProfilePhotoCropper;