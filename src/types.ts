export type StoreType = 'Boutique' | 'Multimarcas' | 'Loja de shopping' | 'Loja online' | 'Outro';

export type BrandInterest = 'Bakulelê' | 'Biliton' | 'As duas marcas';

export interface RegisterFormData {
  storeName: string;
  contactName: string;
  whatsapp: string;
  cnpj: string;
  city: string;
  state: string;
  instagram: string;
  brandsSold: string;
  storeType: StoreType;
  interestedBrand: BrandInterest;
  agreedTerms: boolean;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface BenefitItem {
  id: string;
  title: string;
  description: string;
}

export interface GalleryItem {
  id: string;
  tag: string;
  title: string;
  url: string;
  alt: string;
}
