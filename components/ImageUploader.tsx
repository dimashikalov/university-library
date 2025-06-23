'use client';
import config from '@/lib/config';
import {
  Image as IKImage,
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitProvider,
  ImageKitServerError,
  ImageKitUploadNetworkError,
  upload,
  UploadResponse,
} from '@imagekit/next';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { toast, ToasterProps } from 'sonner';

const {
  env: {
    imagekit: { publicKey, urlEndpoint },
  },
} = config;

const authenticator = async () => {
  try {
    const response = await fetch(`${config.env.apiEndpoint}/api/auth/imagekit`);

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Request failed with status ${response.status}: ${errorText}`
      );
    }

    const data = await response.json();

    const { signature, expire, token } = data;

    return { token, expire, signature };
  } catch (error: any) {
    throw new Error(`Authentication request failed: ${error.message}`);
  }
};

interface Props {
  // type: 'image' | 'video';
  // accept: string;
  // placeholder: string;
  // folder: string;
  // variant: 'dark' | 'light';
  onFileChange: (filePath: string) => void;
  // value?: string;
}

const ImageUploader = ({ onFileChange }: Props) => {
  const IKUploadRef = useRef<HTMLInputElement>(null);
  const [filePath, setFilePath] = useState<{ filePath: string } | null>(null);
  const abortController = new AbortController();

  const handleFileChange = async () => {
    const fileInput = IKUploadRef.current;

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      alert('Please select a file to upload');
      return;
    }
    const file = fileInput.files[0];
    let authParams;
    try {
      authParams = await authenticator();
    } catch (authError) {
      console.error('Failed to authenticate for upload:', authError);
      return;
    }
    const { signature, expire, token } = authParams;

    try {
      const uploadResponse = await upload({
        // Authentication parameters
        expire,
        token,
        signature,
        publicKey,
        file,
        fileName: file.name, // Optionally set a custom file name

        // Abort signal to allow cancellation of the upload if needed.
        abortSignal: abortController.signal,
      });
      console.log('Upload response:', uploadResponse);
      if (uploadResponse) {
        // setFilePath({ filePath: uploadResponse.filePath });
        onSuccess(uploadResponse);
      }

      // if (uploadResponse) {
      //   onSuccess(uploadResponse);
      // }
    } catch (error) {
      // Handle specific error types provided by the ImageKit SDK.
      if (error instanceof ImageKitAbortError) {
        console.error('Upload aborted:', error.reason);
        onError(error);
      } else if (error instanceof ImageKitInvalidRequestError) {
        console.error('Invalid request:', error.message);
        onError(error);
      } else if (error instanceof ImageKitUploadNetworkError) {
        console.error('Network error:', error.message);
        onError(error);
      } else if (error instanceof ImageKitServerError) {
        console.error('Server error:', error.message);
        onError(error);
      } else {
        // Handle any other errors that may occur.
        console.error('Upload error:', error);
        onError(error);
      }
    }
  };

  const onError = (error: any) => {
    console.log(error);

    toast('Upload failed', {
      description: `Your  could not be uploaded. Please try again.`,
      position: 'bottom-right',
      duration: 3000,
      onDismiss: () => console.log('Уведомление закрыто'),
    });
  };

  const onSuccess = (res: UploadResponse) => {
    if (res.filePath) {
      setFilePath({ filePath: res.filePath });
      onFileChange(res.filePath);
    }

    toast('Ваш файл был успешно загружен!', {
      // title: 'Успех',
      // description: `${res.filePath} uploaded successfully!`,
      duration: 3000,
      onDismiss: () => console.log('Уведомление закрыто'),
      position: 'bottom-right',
      style: {
        backgroundColor: '#4B5563', // Темный фон
        color: '#FFFFFF', // Белый текст
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
      },
    });
    // toast({
    //   title: `${type} uploaded successfully`,
    //   description: `${res.filePath} uploaded successfully!`,
    // });
  };

  return (
    <>
      <ImageKitProvider urlEndpoint={urlEndpoint}>
        <input
          type="file"
          className="hidden"
          ref={IKUploadRef}
          onChange={handleFileChange}
        />
        <Button
          // onClick={ handleUpload }
          onClick={(e) => {
            e.preventDefault();
            if (IKUploadRef.current) {
              IKUploadRef.current.click();
            }
          }}
        >
          <Image
            src="/icons/upload.svg"
            alt="upload-icon"
            width={20}
            height={20}
            className="object-contain"
          />
          <p className={cn('text-base')}>Upload a File</p>
          {filePath && <p className="upload-filename">{filePath.filePath}</p>}
        </Button>

        {filePath && (
          <IKImage
            alt={filePath.filePath}
            src={filePath.filePath}
            width={500}
            height={300}
          />
        )}
      </ImageKitProvider>
    </>
  );
};

export default ImageUploader;
