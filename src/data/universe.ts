import type { StockUniverseItem } from '../types';

export const STOCK_UNIVERSE: StockUniverseItem[] = [
  // 1. Banking & Financial Services
  { ticker: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking & Finance', basePrice: 732.00 },
  { ticker: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking & Finance', basePrice: 1342.00 },
  { ticker: 'SBIN', name: 'State Bank of India', sector: 'Banking & Finance', basePrice: 992.00 },
  { ticker: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd', sector: 'Banking & Finance', basePrice: 1785.60 },
  { ticker: 'AXISBANK', name: 'Axis Bank Ltd', sector: 'Banking & Finance', basePrice: 1195.20 },
  { ticker: 'BAJFINANCE', name: 'Bajaj Finance Ltd', sector: 'Banking & Finance', basePrice: 6980.00 },
  { ticker: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd', sector: 'Banking & Finance', basePrice: 1610.50 },
  { ticker: 'INDUSINDBK', name: 'IndusInd Bank Ltd', sector: 'Banking & Finance', basePrice: 1420.00 },
  { ticker: 'PNB', name: 'Punjab National Bank', sector: 'Banking & Finance', basePrice: 118.50 },
  { ticker: 'BANKBARODA', name: 'Bank of Baroda', sector: 'Banking & Finance', basePrice: 245.00 },
  { ticker: 'CHOLAFIN', name: 'Cholamandalam Inv & Fin Co', sector: 'Banking & Finance', basePrice: 1460.00 },
  { ticker: 'MUTHOOTFIN', name: 'Muthoot Finance Ltd', sector: 'Banking & Finance', basePrice: 1910.00 },
  { ticker: 'SHRIRAMFIN', name: 'Shriram Finance Ltd', sector: 'Banking & Finance', basePrice: 3250.00 },
  { ticker: 'HDFCLIFE', name: 'HDFC Life Insurance Co', sector: 'Banking & Finance', basePrice: 710.00 },
  { ticker: 'SBILIFE', name: 'SBI Life Insurance Co', sector: 'Banking & Finance', basePrice: 1780.00 },
  { ticker: 'ICICIPRULI', name: 'ICICI Prudential Life Ins', sector: 'Banking & Finance', basePrice: 720.00 },

  // 2. Information Technology
  { ticker: 'TCS', name: 'Tata Consultancy Services Ltd', sector: 'Information Technology', basePrice: 2117.00 },
  { ticker: 'INFY', name: 'Infosys Ltd', sector: 'Information Technology', basePrice: 1475.00 },
  { ticker: 'WIPRO', name: 'Wipro Ltd', sector: 'Information Technology', basePrice: 540.30 },
  { ticker: 'HCLTECH', name: 'HCL Technologies Ltd', sector: 'Information Technology', basePrice: 1750.40 },
  { ticker: 'TECHM', name: 'Tech Mahindra Ltd', sector: 'Information Technology', basePrice: 1615.00 },
  { ticker: 'LTIM', name: 'LTIMindtree Ltd', sector: 'Information Technology', basePrice: 5890.00 },
  { ticker: 'PERSISTENT', name: 'Persistent Systems Ltd', sector: 'Information Technology', basePrice: 5120.00 },
  { ticker: 'COFORGE', name: 'Coforge Ltd', sector: 'Information Technology', basePrice: 6850.00 },
  { ticker: 'MPHASIS', name: 'Mphasis Ltd', sector: 'Information Technology', basePrice: 2980.00 },
  { ticker: 'KPITTECH', name: 'KPIT Technologies Ltd', sector: 'Information Technology', basePrice: 1670.00 },
  { ticker: 'TATAELXSI', name: 'Tata Elxsi Ltd', sector: 'Information Technology', basePrice: 7450.00 },

  // 3. Automobile & Mobility
  { ticker: 'TATAMOTORS', name: 'Tata Motors Ltd', sector: 'Automobile', basePrice: 978.60 },
  { ticker: 'MARUTI', name: 'Maruti Suzuki India Ltd', sector: 'Automobile', basePrice: 12450.00 },
  { ticker: 'M&M', name: 'Mahindra & Mahindra Ltd', sector: 'Automobile', basePrice: 2890.30 },
  { ticker: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd', sector: 'Automobile', basePrice: 11200.00 },
  { ticker: 'HEROMOTOCO', name: 'Hero MotoCorp Ltd', sector: 'Automobile', basePrice: 5420.00 },
  { ticker: 'EICHERMOT', name: 'Eicher Motors Ltd', sector: 'Automobile', basePrice: 4720.00 },
  { ticker: 'TVSMOTOR', name: 'TVS Motor Company Ltd', sector: 'Automobile', basePrice: 2680.00 },
  { ticker: 'BHARATFORG', name: 'Bharat Forge Ltd', sector: 'Automobile', basePrice: 1540.00 },
  { ticker: 'ASHOKLEY', name: 'Ashok Leyland Ltd', sector: 'Automobile', basePrice: 235.00 },
  { ticker: 'MOTHERSON', name: 'Samvardhana Motherson Intl', sector: 'Automobile', basePrice: 198.00 },

  // 4. Energy, Oil & Gas
  { ticker: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Energy, Oil & Gas', basePrice: 1243.00 },
  { ticker: 'ONGC', name: 'Oil and Natural Gas Corp', sector: 'Energy, Oil & Gas', basePrice: 310.20 },
  { ticker: 'IOC', name: 'Indian Oil Corporation Ltd', sector: 'Energy, Oil & Gas', basePrice: 168.00 },
  { ticker: 'BPCL', name: 'Bharat Petroleum Corp Ltd', sector: 'Energy, Oil & Gas', basePrice: 345.00 },
  { ticker: 'HPCL', name: 'Hindustan Petroleum Corp', sector: 'Energy, Oil & Gas', basePrice: 395.00 },
  { ticker: 'GAIL', name: 'GAIL (India) Ltd', sector: 'Energy, Oil & Gas', basePrice: 228.00 },
  { ticker: 'OIL', name: 'Oil India Ltd', sector: 'Energy, Oil & Gas', basePrice: 685.00 },
  { ticker: 'PETRONET', name: 'Petronet LNG Ltd', sector: 'Energy, Oil & Gas', basePrice: 335.00 },

  // 5. Power & Green Utilities
  { ticker: 'NTPC', name: 'NTPC Ltd', sector: 'Power & Utilities', basePrice: 395.50 },
  { ticker: 'POWERGRID', name: 'Power Grid Corp of India', sector: 'Power & Utilities', basePrice: 325.80 },
  { ticker: 'TATAPOWER', name: 'Tata Power Company Ltd', sector: 'Power & Utilities', basePrice: 435.00 },
  { ticker: 'ADANIGREEN', name: 'Adani Green Energy Ltd', sector: 'Power & Utilities', basePrice: 1910.00 },
  { ticker: 'ADANIPOWER', name: 'Adani Power Ltd', sector: 'Power & Utilities', basePrice: 645.00 },
  { ticker: 'JSWENERGY', name: 'JSW Energy Ltd', sector: 'Power & Utilities', basePrice: 690.00 },
  { ticker: 'NHPC', name: 'NHPC Ltd', sector: 'Power & Utilities', basePrice: 94.50 },
  { ticker: 'COALINDIA', name: 'Coal India Ltd', sector: 'Power & Utilities', basePrice: 485.60 },

  // 6. Pharmaceuticals & Healthcare
  { ticker: 'SUNPHARMA', name: 'Sun Pharmaceutical Ind Ltd', sector: 'Pharma & Healthcare', basePrice: 1740.00 },
  { ticker: 'CIPLA', name: 'Cipla Ltd', sector: 'Pharma & Healthcare', basePrice: 1530.20 },
  { ticker: 'DRREDDY', name: "Dr. Reddy's Laboratories Ltd", sector: 'Pharma & Healthcare', basePrice: 6620.00 },
  { ticker: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise', sector: 'Pharma & Healthcare', basePrice: 6940.50 },
  { ticker: 'DIVISLAB', name: "Divi's Laboratories Ltd", sector: 'Pharma & Healthcare', basePrice: 5180.00 },
  { ticker: 'LUPIN', name: 'Lupin Ltd', sector: 'Pharma & Healthcare', basePrice: 2150.00 },
  { ticker: 'ZYDUSLIFE', name: 'Zydus Lifesciences Ltd', sector: 'Pharma & Healthcare', basePrice: 1080.00 },
  { ticker: 'MANKIND', name: 'Mankind Pharma Ltd', sector: 'Pharma & Healthcare', basePrice: 2450.00 },
  { ticker: 'TORNTPHARM', name: 'Torrent Pharmaceuticals Ltd', sector: 'Pharma & Healthcare', basePrice: 3290.00 },
  { ticker: 'AUROPHARMA', name: 'Aurobindo Pharma Ltd', sector: 'Pharma & Healthcare', basePrice: 1480.00 },
  { ticker: 'MAXHEALTH', name: 'Max Healthcare Institute', sector: 'Pharma & Healthcare', basePrice: 940.00 },

  // 7. FMCG & Consumer Goods
  { ticker: 'ITC', name: 'ITC Ltd', sector: 'FMCG & Consumer', basePrice: 495.10 },
  { ticker: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', sector: 'FMCG & Consumer', basePrice: 2780.00 },
  { ticker: 'NESTLEIND', name: 'Nestle India Ltd', sector: 'FMCG & Consumer', basePrice: 2510.00 },
  { ticker: 'BRITANNIA', name: 'Britannia Industries Ltd', sector: 'FMCG & Consumer', basePrice: 5850.00 },
  { ticker: 'TITAN', name: 'Titan Company Ltd', sector: 'FMCG & Consumer', basePrice: 3620.00 },
  { ticker: 'ASIANPAINT', name: 'Asian Paints Ltd', sector: 'FMCG & Consumer', basePrice: 3180.00 },
  { ticker: 'DABUR', name: 'Dabur India Ltd', sector: 'FMCG & Consumer', basePrice: 585.00 },
  { ticker: 'GODREJCP', name: 'Godrej Consumer Products', sector: 'FMCG & Consumer', basePrice: 1420.00 },
  { ticker: 'MARICO', name: 'Marico Ltd', sector: 'FMCG & Consumer', basePrice: 650.00 },
  { ticker: 'TATACONSUM', name: 'Tata Consumer Products Ltd', sector: 'FMCG & Consumer', basePrice: 1140.00 },
  { ticker: 'VBL', name: 'Varun Beverages Ltd', sector: 'FMCG & Consumer', basePrice: 1560.00 },
  { ticker: 'COLPAL', name: 'Colgate-Palmolive (India)', sector: 'FMCG & Consumer', basePrice: 3480.00 },
  { ticker: 'TRENT', name: 'Trent Ltd', sector: 'FMCG & Consumer', basePrice: 6980.00 },

  // 8. Metals & Mining
  { ticker: 'TATASTEEL', name: 'Tata Steel Ltd', sector: 'Metals & Mining', basePrice: 152.40 },
  { ticker: 'JSWSTEEL', name: 'JSW Steel Ltd', sector: 'Metals & Mining', basePrice: 945.00 },
  { ticker: 'HINDALCO', name: 'Hindalco Industries Ltd', sector: 'Metals & Mining', basePrice: 685.20 },
  { ticker: 'JINDALSTEL', name: 'Jindal Steel & Power Ltd', sector: 'Metals & Mining', basePrice: 990.00 },
  { ticker: 'VEDL', name: 'Vedanta Ltd', sector: 'Metals & Mining', basePrice: 475.00 },
  { ticker: 'NMDC', name: 'NMDC Ltd', sector: 'Metals & Mining', basePrice: 225.00 },
  { ticker: 'SAIL', name: 'Steel Authority of India', sector: 'Metals & Mining', basePrice: 135.00 },
  { ticker: 'NATIONALUM', name: 'National Aluminium Co Ltd', sector: 'Metals & Mining', basePrice: 185.00 },

  // 9. Cement & Building Materials
  { ticker: 'ULTRACEMCO', name: 'UltraTech Cement Ltd', sector: 'Cement & Building Materials', basePrice: 11450.00 },
  { ticker: 'GRASIM', name: 'Grasim Industries Ltd', sector: 'Cement & Building Materials', basePrice: 2680.00 },
  { ticker: 'AMBUJACEM', name: 'Ambuja Cements Ltd', sector: 'Cement & Building Materials', basePrice: 630.00 },
  { ticker: 'ACC', name: 'ACC Ltd', sector: 'Cement & Building Materials', basePrice: 2480.00 },
  { ticker: 'SHREECEM', name: 'Shree Cement Ltd', sector: 'Cement & Building Materials', basePrice: 24600.00 },

  // 10. Infrastructure, Capital Goods & Defense
  { ticker: 'LT', name: 'Larsen & Toubro Ltd', sector: 'Capital Goods & Infra', basePrice: 3875.00 },
  { ticker: 'HAL', name: 'Hindustan Aeronautics Ltd', sector: 'Capital Goods & Infra', basePrice: 4680.00 },
  { ticker: 'BEL', name: 'Bharat Electronics Ltd', sector: 'Capital Goods & Infra', basePrice: 295.00 },
  { ticker: 'BHEL', name: 'Bharat Heavy Electricals Ltd', sector: 'Capital Goods & Infra', basePrice: 275.00 },
  { ticker: 'SIEMENS', name: 'Siemens Ltd', sector: 'Capital Goods & Infra', basePrice: 6890.00 },
  { ticker: 'ABB', name: 'ABB India Ltd', sector: 'Capital Goods & Infra', basePrice: 8150.00 },
  { ticker: 'CUMMINSIND', name: 'Cummins India Ltd', sector: 'Capital Goods & Infra', basePrice: 3780.00 },
  { ticker: 'POLYCAB', name: 'Polycab India Ltd', sector: 'Capital Goods & Infra', basePrice: 6720.00 },
  { ticker: 'HAVELLS', name: 'Havells India Ltd', sector: 'Capital Goods & Infra', basePrice: 1890.00 },
  { ticker: 'MAZDOCK', name: 'Mazagon Dock Shipbuilders', sector: 'Capital Goods & Infra', basePrice: 4120.00 },

  // 11. Telecom & Media
  { ticker: 'BHARTIARTL', name: 'Bharti Airtel Ltd', sector: 'Telecom & Media', basePrice: 1840.00 },
  { ticker: 'TATACOMM', name: 'Tata Communications Ltd', sector: 'Telecom & Media', basePrice: 1980.00 },
  { ticker: 'ZEEL', name: 'Zee Entertainment Enterprise', sector: 'Telecom & Media', basePrice: 135.00 },
  { ticker: 'PVRINOX', name: 'PVR INOX Ltd', sector: 'Telecom & Media', basePrice: 1420.00 },

  // 12. Chemicals & Fertilizers
  { ticker: 'PIIND', name: 'PI Industries Ltd', sector: 'Chemicals & Fertilizers', basePrice: 4250.00 },
  { ticker: 'SRF', name: 'SRF Ltd', sector: 'Chemicals & Fertilizers', basePrice: 2410.00 },
  { ticker: 'TATACHEM', name: 'Tata Chemicals Ltd', sector: 'Chemicals & Fertilizers', basePrice: 1040.00 },
  { ticker: 'DEEPAKNTR', name: 'Deepak Nitrite Ltd', sector: 'Chemicals & Fertilizers', basePrice: 2840.00 },
  { ticker: 'UPL', name: 'UPL Ltd', sector: 'Chemicals & Fertilizers', basePrice: 565.00 },

  // 13. Realty & Real Estate
  { ticker: 'DLF', name: 'DLF Ltd', sector: 'Realty', basePrice: 865.00 },
  { ticker: 'LODHA', name: 'Macrotech Developers Ltd', sector: 'Realty', basePrice: 1220.00 },
  { ticker: 'GODREJPROP', name: 'Godrej Properties Ltd', sector: 'Realty', basePrice: 2950.00 },
  { ticker: 'OBEROIRLTY', name: 'Oberoi Realty Ltd', sector: 'Realty', basePrice: 1840.00 },

  // 14. Aviation, Logistics & Ports
  { ticker: 'INDIGO', name: 'InterGlobe Aviation Ltd', sector: 'Logistics & Aviation', basePrice: 4780.00 },
  { ticker: 'ADANIPORTS', name: 'Adani Ports and SEZ Ltd', sector: 'Logistics & Aviation', basePrice: 1460.00 },
  { ticker: 'CONCOR', name: 'Container Corp of India', sector: 'Logistics & Aviation', basePrice: 940.00 },
  { ticker: 'DELHIVERY', name: 'Delhivery Ltd', sector: 'Logistics & Aviation', basePrice: 420.00 },

  // 15. Conglomerates & New-Age Tech
  { ticker: 'ADANIENT', name: 'Adani Enterprises Ltd', sector: 'Conglomerate & New-Age', basePrice: 3020.00 },
  { ticker: 'GROWW', name: 'Groww (Billionbrains Garage Ventures Ltd)', sector: 'Conglomerate & New-Age', basePrice: 148.00 },
  { ticker: 'ZOMATO', name: 'Zomato Ltd', sector: 'Conglomerate & New-Age', basePrice: 265.00 },
  { ticker: 'JIOFIN', name: 'Jio Financial Services Ltd', sector: 'Conglomerate & New-Age', basePrice: 345.00 },
  { ticker: 'PAYTM', name: 'One97 Communications (Paytm)', sector: 'Conglomerate & New-Age', basePrice: 655.00 },
  { ticker: 'NYKAA', name: 'FSN E-Commerce Ventures (Nykaa)', sector: 'Conglomerate & New-Age', basePrice: 205.00 },
  { ticker: 'POLICYBZR', name: 'PB Fintech Ltd (PolicyBazaar)', sector: 'Conglomerate & New-Age', basePrice: 1720.00 },
  { ticker: 'ANGELONE', name: 'Angel One Ltd', sector: 'Banking & Finance', basePrice: 2850.00 },
  { ticker: 'CDSL', name: 'Central Depository Services Ltd', sector: 'Banking & Finance', basePrice: 1520.00 },
  { ticker: 'BSE', name: 'BSE Ltd', sector: 'Banking & Finance', basePrice: 2680.00 },
];

export const STOCK_UNIVERSE_MAP = STOCK_UNIVERSE.reduce<Record<string, StockUniverseItem>>((acc, item) => {
  acc[item.ticker] = item;
  return acc;
}, {});

export const SECTORS = [
  'All Sectors',
  'Banking & Finance',
  'Information Technology',
  'Automobile',
  'Energy, Oil & Gas',
  'Power & Utilities',
  'Pharma & Healthcare',
  'FMCG & Consumer',
  'Metals & Mining',
  'Cement & Building Materials',
  'Capital Goods & Infra',
  'Telecom & Media',
  'Chemicals & Fertilizers',
  'Realty',
  'Logistics & Aviation',
  'Conglomerate & New-Age',
] as const;
