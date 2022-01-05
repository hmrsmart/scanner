import init, { find_document, extract_document, find_edges } from '../pkg';
import { toPDF } from './pdf';
import { getImage, download } from './io';
import 'image-capture';

const root = document.getElementById('root') as HTMLDivElement;
const preview = document.getElementById('preview') as HTMLVideoElement;
const previewCrop = document.getElementById('preview-crop') as HTMLDivElement;
const bottomWrapper = document.getElementById('bottom-wrapper') as HTMLDivElement;
const topWrapper = document.getElementById('top-wrapper') as HTMLDivElement;
const selectWrapper = document.getElementById('camera-select-wrapper') as HTMLDivElement;
const select = document.getElementById('camera-select') as HTMLSelectElement;
const uploadWrapper = document.getElementById('upload-wrapper') as HTMLDivElement;
const upload = document.getElementById('upload') as HTMLInputElement;
const shutter = document.getElementById('shutter') as HTMLImageElement;
const doneWrapper = document.getElementById('done-wrapper') as HTMLDivElement;
const done = document.getElementById('done') as HTMLButtonElement;

type MaxRes = {
  width: number;
  height: number;
  deviceId: string;
};

let defaultMaxRes: Promise<MaxRes>;
let maxRes: Record<string, Promise<MaxRes> | undefined> = {};
let wasmLoaded: Promise<void>;
const pages: ImageData[] = [];


const log = (text: string) => {
  const el = document.createElement('div');
  el.innerText = text;
  root.appendChild(el);
}

const getMaxRes = (device?: string) => {
  const constraints: MediaTrackConstraints = {
    width: 100000,
    height: 100000,
    facingMode: 'environment'
  };
  if (device) {
    if (maxRes[device]) return maxRes[device]!;
    constraints.deviceId = { exact: device };
  } else if (defaultMaxRes) {
    return defaultMaxRes;
  }
  const prom = navigator.mediaDevices.getUserMedia({
    video: constraints 
  }).then(media => {
    const settings = media.getVideoTracks()[0].getSettings();
    for (const track of media.getTracks()) {
      track.stop();
    }
    const width = Math.max(settings.width!, settings.height!);
    const height = Math.min(settings.width!, settings.height!);
    return { width, height, deviceId: settings.deviceId! };
  });
  if (device) maxRes[device] = prom;
  else defaultMaxRes = prom.then(val => {
    maxRes[val.deviceId] = prom;
    return val;
  });
  return prom;
}

const processImage = (img: ImageData) => {
  // const cnv = document.createElement('canvas');
  // cnv.width = img.width;
  // cnv.height = img.height;
  // const ctx = cnv.getContext('2d')!;
  // const diag = Math.hypot(img.width, img.height);
  // let by = Math.min(img.width, img.height) / 360;
  // if (by < 2) by = 1;
  // ctx.putImageData(img, 0, 0);
  // const edges = find_edges(img, 0.05);
  // for (const { bin: b, angle: a, score } of edges) {
  //   const bin = Math.round(b) * by, angle = a * Math.PI / 256;
  //   ctx.strokeStyle = `rgba(255, 0, 0, ${score / edges[0].score})`;
  //   ctx.lineWidth = 5;
  //   const c = Math.cos(angle);
  //   const s = Math.sin(angle);
  //   const rho = ((bin << 1) - diag);
  //   const x = s * rho, y = c * rho;
  //   ctx.beginPath();
  //   ctx.moveTo(x + c * 10000, y - s * 10000);
  //   ctx.lineTo(x - c * 10000, y + s * 10000);
  //   ctx.stroke();
  // }
  // document.body.appendChild(cnv);
  const doc = extract_document(img, find_document(img)!, 1224);
  pages.push(doc);
}

const startStream = async (device?: string) => {
  const maxRes = await getMaxRes(device);
  let aspectRatio = maxRes.width / maxRes.height;
  const landscape = window.innerWidth > (window.innerHeight * aspectRatio);
  const height = landscape ? window.innerHeight : Math.floor(Math.min(window.innerWidth * aspectRatio, window.innerHeight * 0.84));
  const width = landscape ? Math.floor(Math.min(window.innerHeight * aspectRatio, window.innerWidth * 0.84)) : window.innerWidth;
  const cssHeight = height + 'px';
  const cssWidth = width + 'px';
  previewCrop.style.width = previewCrop.style.minWidth = cssWidth;
  previewCrop.style.height = previewCrop.style.minHeight = cssHeight;
  root.style.width = window.innerWidth + 'px';
  root.style.height = window.innerHeight + 'px';
  if (landscape) {
    preview.style.height = cssHeight;
    preview.style.width = '';
    root.style.flexDirection = 'row';
    topWrapper.style.flexDirection = bottomWrapper.style.flexDirection = 'column';
    topWrapper.style.height = bottomWrapper.style.height = window.innerHeight + 'px';
    topWrapper.style.width = bottomWrapper.style.width = '';
    shutter.style.margin = doneWrapper.style.margin = uploadWrapper.style.margin = selectWrapper.style.margin = 0.02 * window.innerWidth + 'px';
    selectWrapper.style.width = selectWrapper.style.height = 0.03 * window.innerWidth + 'px';
    doneWrapper.style.width = doneWrapper.style.height = uploadWrapper.style.width = uploadWrapper.style.height = 0.035 * window.innerWidth + 'px';
    shutter.style.height = 0.05 * window.innerWidth + 'px';
  } else {
    preview.style.height = '';
    preview.style.width = cssWidth;
    root.style.flexDirection = 'column';
    topWrapper.style.flexDirection = bottomWrapper.style.flexDirection = 'row';
    topWrapper.style.height = bottomWrapper.style.height = '';
    topWrapper.style.width = bottomWrapper.style.width = window.innerWidth + 'px';
    shutter.style.margin = doneWrapper.style.margin = uploadWrapper.style.margin = selectWrapper.style.margin = 0.02 * window.innerHeight + 'px';
    selectWrapper.style.width = selectWrapper.style.height = 0.03 * window.innerHeight + 'px';
    doneWrapper.style.width = doneWrapper.style.height = uploadWrapper.style.width = uploadWrapper.style.height = shutter.style.height = 0.035 * window.innerHeight + 'px';
    shutter.style.height = 0.05 * window.innerHeight + 'px';
  }
  const constraints: MediaTrackConstraints = {
    width: maxRes.width, 
    height: maxRes.height,
    facingMode: 'environment',
    deviceId: { exact: maxRes.deviceId }
  };
  const stream = await navigator.mediaDevices.getUserMedia({
    video: constraints
  });
  const videoTrack = stream.getVideoTracks()[0];
  preview.srcObject = stream;
  const cap = new ImageCapture(videoTrack);
  const onShutterClick = async () => {
    await wasmLoaded;
    const photo = await cap.takePhoto();
    processImage(await getImage(photo));
  }
  shutter.addEventListener('click', onShutterClick);
  return {
    deviceId: maxRes.deviceId,
    close() {
      shutter.removeEventListener('click', onShutterClick);
      preview.pause();
      preview.srcObject = null;
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }
  }
}


const onLoad = async () => {
  wasmLoaded = init().then();
  let stream = await startStream(localStorage.getItem('defaultDevice')!);
  const updateBold = () => {
    for (const option of select.options) {
      option.style.fontWeight = '';
    }
    select.selectedOptions[0].style.fontWeight = 'bold';
  }
  for (const device of await navigator.mediaDevices.enumerateDevices()) {
    if (device.kind == 'videoinput') {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.label = device.label;
      select.appendChild(option);
    }
  }
  select.value = stream.deviceId;
  updateBold();
  const onUpdate = async () => {
    updateBold();
    stream.close();
    select.disabled = true;
    localStorage.setItem('defaultDevice', select.value);
    stream = await startStream(select.value);
    select.disabled = false;
  };
  select.onchange = onUpdate;
  let rst = -1;
  window.onresize = () => {
    clearTimeout(rst);
    rst = setTimeout(onUpdate, 250) as unknown as number;
  };
  upload.onchange = async () => {
    for (const file of upload.files!) {
      processImage(await getImage(file));
    }
  };
  done.onclick = async () => {
    download(new Blob([await toPDF(pages)]), 'out.pdf')
    pages.length = 0;
  }
}

onLoad();

if (process.env.NODE_ENV == 'production') {
  navigator.serviceWorker?.register(new URL('sw.ts', import.meta.url), { type: 'module' });
}
