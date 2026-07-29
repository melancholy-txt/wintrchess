declare module "*.module.css";

declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.svg";
declare module "*.gif";
declare module "*.mp3";

declare interface Window {
    adsbygoogle: any[];
    googlefc: {
        callbackQueue: any[];
        showRevocationMessage: () => void;
    };
    dataLayer: IArguments[];
}