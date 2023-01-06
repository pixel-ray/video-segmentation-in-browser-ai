import React, { useState, useEffect, useRef } from 'react';
import { ImageMetadata, SegmentationModel } from 'in-browser-ai';

/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from '@emotion/react';
import styled from '@emotion/styled';

const metadata: ImageMetadata = {
  id: '123',
  modelPath:
    'https://huggingface.co/visheratin/segformer-b0-finetuned-ade-512-512/resolve/main/b0.onnx.gz',
  configPath:
    'https://huggingface.co/visheratin/segformer-b0-finetuned-ade-512-512/resolve/main/config.json',
  preprocessorPath:
    'https://huggingface.co/visheratin/segformer-b0-finetuned-ade-512-512/resolve/main/preprocessor_config.json',
};

interface SizeProps {
  width: number;
  height: number;
}

const Container = styled.div({
  display: 'flex',
});

const Img = styled('img')<SizeProps>`
  width: ${(props: SizeProps) => props.width}px;
  height: ${(props: SizeProps) => props.height}px;
  position: absolute;
`;

const LayeredImage = styled(Img)({
  opacity: 0.5,
});

const Canvas = styled('canvas')<SizeProps>`
  width: ${(props: SizeProps) => props.width};
  height: ${(props: SizeProps) => props.height};
  left: 0;
  top: 0;
  opacity: 0.5;
  position: absolute;
`;

const VideoSegmentation: React.FC = () => {
  const [model, setModel] = useState<any>();
  const [imgWidth, setImgWidth] = useState<number>(0);
  const [imgHeight, setImgHeight] = useState<number>(0);
  //   // to use canvas uncomment
  //   const canvas = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [segSrc, setSegSrc] = useState<string>();
  const [frameDataURL, setFrameDataURL] = useState<string>();
  const [fpInterval, setFpInterval] = useState<NodeJS.Timer>();

  useEffect(() => {
    capture();
    const getModel = async () => {
      const model = new SegmentationModel(metadata);
      await model.init();
      if (model) {
        setModel(model);
      }
    };

    getModel();
  }, []);

  useEffect(() => {
    setImgWidth(window.innerWidth * 0.6);
    setImgHeight(window.innerWidth * 0.45);
  }, []);

  useEffect(() => {
    const fpIntervalLoc = setInterval(() => {
      const constraints = {
        audio: false,
        video: { width: imgWidth, height: imgHeight, facingMode: 'user' },
      };
      navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function (mediaStream) {
          const track = mediaStream.getVideoTracks()[0];
          const imageCapture = new ImageCapture(track);
          imageCapture
            .takePhoto()
            .then((blob) => {
              console.log('Took photo:', blob);
              const captureURL = URL.createObjectURL(blob);
              setFrameDataURL(captureURL);
            })
            .catch((error) => {
              console.error('takePhoto() error: ', error);
            });
        })
        .catch(function (err) {
          console.log(err.message);
        });
    }, 1000);
    setFpInterval(fpIntervalLoc);
  }, []);

  useEffect(() => {
    const getResults = async () => {
      if (model && frameDataURL) {
        console.log('frame data url', frameDataURL);
        const output = await model.process(frameDataURL);
        console.log(output);
        const imgTemp = output.canvas.toDataURL('image/png');

        // // to use canvas uncomment
        // const ctx = canvas.current?.getContext('2d');
        // if (ctx && canvas.current) {
        //   ctx.globalAlpha = 0.4;
        //   ctx.drawImage(
        //     output.canvas,
        //     0,
        //     0,
        //     output.canvas.width,
        //     output.canvas.height,
        //     0,
        //     0,
        //     canvas.current.width,
        //     canvas.current.height,
        //   );
        // }

        setSegSrc(imgTemp);
      }
    };

    getResults();
  }, [frameDataURL]);

  const onPlay = () => {
    console.log('onPlay');
  };

  const capture = () => {
    const constraints = {
      audio: false,
      video: { width: imgWidth, height: imgHeight, facingMode: 'user' },
    };
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((mediaStream) => {
        const video = videoRef.current;
        if (video) {
          video.srcObject = mediaStream;
          video.onloadedmetadata = () => {
            video.play();
          };
        }
      })
      .catch(function (err) {
        console.log(err.message);
      });
  };

  return (
    <Container>
      <video
        width="60%"
        height=""
        ref={videoRef}
        playsInline
        autoPlay
        onPlay={onPlay}
      ></video>
      <LayeredImage src={segSrc} width={imgWidth} height={imgHeight} />
      {/* <Canvas ref={canvas} width={imgWidth} height={imgHeight}></Canvas> */}
    </Container>
  );
};

export default VideoSegmentation;
