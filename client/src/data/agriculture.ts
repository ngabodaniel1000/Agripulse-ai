import ahs from '@/assets/AHS_2024_Main_report.pdf.asset.json'
import fbs from '@/assets/Food_Balance_Sheets_2025_Report.pdf.asset.json'
import fbs2 from '@/assets/Food_Balance_Sheets_2025_Report_2.pdf.asset.json'
import annex from '@/assets/FBS_Table_Annex.xlsx.asset.json'
import ibes from '@/assets/IBES2024_Main_Report_English_0.pdf.asset.json'
import population from '@/assets/Population_size_and_Population_characteristics.pdf.asset.json'
import trade from '@/assets/Quarterly_Formal_external_trade_in_Goods_reports_2025.pdf.asset.json'
import iip24 from '@/assets/Index_of_Industrial_Production_2024.pdf.asset.json'
import iip25 from '@/assets/Index_of_Industrial_Production_2025.pdf.asset.json'
export const crops = [
 {name:'Beans',adoption:89.8,season:'A',category:'Legumes',note:'Protein & soil nitrogen',symbol:'bean'},
 {name:'Maize',adoption:80.8,season:'A',category:'Cereals',note:'Widely adopted staple',symbol:'wheat'},
 {name:'Avocado',adoption:79.3,season:'Annual',category:'Fruits',note:'Dietary fat diversification',symbol:'fruit'},
 {name:'Banana',adoption:73.9,season:'B',category:'Fruits',note:'Established food crop',symbol:'fruit'},
 {name:'Sweet potato',adoption:55.4,season:'C',category:'Roots & tubers',note:'Nutrition-sensitive varieties',symbol:'root'},
 {name:'Cassava',adoption:49.6,season:'A',category:'Roots & tubers',note:'Resilient staple crop',symbol:'root'},
 {name:'Tomato',adoption:41.8,season:'C',category:'Vegetables',note:'Season C horticulture',symbol:'fruit'},
 {name:'Eggplant',adoption:39.8,season:'A',category:'Vegetables',note:'Horticulture diversification',symbol:'fruit'},
]
export const inputs = [{name:'Organic fertilizer',value:94},{name:'Erosion control',value:90.2},{name:'Extension services',value:67.1},{name:'Inorganic fertilizer',value:66.5},{name:'Improved seeds',value:64.6},{name:'Pesticides',value:42.1},{name:'Irrigation',value:14.1}]
export const sources = [
 {name:'Agricultural Household Survey',period:'2024',tag:'AHS',description:'Crop adoption, farm size and agricultural practices',url:ahs.url},
 {name:'Food Balance Sheets',period:'2025 edition',tag:'FBS',description:'Food availability, nutrition and import dependency',url:fbs.url},
 {name:'Food Balance Sheets — additional report',period:'2025 edition',tag:'FBS',description:'Additional uploaded food balance publication',url:fbs2.url},
 {name:'Food Balance Sheets — table annex',period:'2025 edition',tag:'XLSX',description:'Detailed food balance tables',url:annex.url},
 {name:'Integrated Business Enterprise Survey',period:'2024',tag:'IBES',description:'Enterprises, informality and capacity utilization',url:ibes.url},
 {name:'Population & population characteristics',period:'2022',tag:'RPHC',description:'Population size, urbanization and demographics',url:population.url},
 {name:'Quarterly formal external trade in goods',period:'2025',tag:'TRADE',description:'Exports, imports and re-exports',url:trade.url},
 {name:'Index of Industrial Production',period:'2024',tag:'IIP',description:'Industrial production statistics',url:iip24.url},
 {name:'Index of Industrial Production',period:'2025',tag:'IIP',description:'Industrial production statistics',url:iip25.url},
]
export const opportunities = [
 {name:'Vegetable oils',idr:210,priority:'High priority',reason:'Explore local oilseed processing and supply chains.',crop:'Soybean & groundnut',icon:'oil'},
 {name:'Sugar',idr:102.2,priority:'High priority',reason:'Evaluate domestic production and processing capacity.',crop:'Sugarcane',icon:'sugar'},
 {name:'Fish',idr:81,priority:'Strategic priority',reason:'Assess aquaculture opportunities and nutrient access.',crop:'Aquaculture',icon:'fish'},
]
export const provinceNames = ['All Rwanda','Eastern Province','Southern Province','Western Province','Northern Province','City of Kigali']
