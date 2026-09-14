import { createCNPJHandler } from '@jussimirvfx/cnpj-cascade/vercel';

export default createCNPJHandler({
  landingId: process.env.CRM_CNPJ_LANDING_ID,
});
