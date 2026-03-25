import type { Language } from "./language";

type SiteCopy = {
  productName: string;
  productTagline: string;
  productDescription: string;
  headerChip: string;
  nav: {
    home: string;
    directory: string;
    providers: string;
  };
  headerCta: string;
  languageToggle: string;
  languageToggleHint: string;
  session: {
    buyer: string;
    seller: string;
  };
};

export const siteCopy: Record<Language, SiteCopy> = {
  zh: {
    productName: "SellerOS",
    productTagline: "x402 服务接入层",
    productDescription: "给 API 加一层 x402，让 Agent 按次付费调用。",
    headerChip: "x402",
    nav: {
      home: "首页",
      directory: "服务目录",
      providers: "服务商入驻"
    },
    headerCta: "开始安装",
    languageToggle: "语言",
    languageToggleHint: "中文 / EN",
    session: {
      buyer: "买方",
      seller: "服务商"
    }
  },
  en: {
    productName: "SellerOS",
    productTagline: "x402 service layer",
    productDescription: "Wrap your API with x402. Agents pay per call.",
    headerChip: "x402",
    nav: {
      home: "Home",
      directory: "Directory",
      providers: "Providers"
    },
    headerCta: "Get Started",
    languageToggle: "Language",
    languageToggleHint: "English / 中文",
    session: {
      buyer: "Buyer",
      seller: "Provider"
    }
  }
};
