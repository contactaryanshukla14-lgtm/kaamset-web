import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
export type InterfaceLanguage='English'|'Hindi'|'Hinglish';
const languages:InterfaceLanguage[]=['English','Hindi','Hinglish'];
const Context=createContext({language:'English' as InterfaceLanguage,setLanguage:(_language:InterfaceLanguage)=>{},t:(text:string)=>text});
export function LanguageProvider({children}:{children:ReactNode}){
  const [translations,setTranslations]=useState<Record<string,Partial<Record<InterfaceLanguage,string>>>>({});
  const [language,setLanguage]=useState<InterfaceLanguage>(()=>{try{const saved=localStorage.getItem('kaamset_interface_language');return languages.includes(saved as InterfaceLanguage)?saved as InterfaceLanguage:'English';}catch{return 'English';}});
  useEffect(()=>{document.documentElement.lang=language==='Hindi'?'hi':language==='Hinglish'?'hi-Latn':'en';try{localStorage.setItem('kaamset_interface_language',language)}catch{}},[language]);
  useEffect(()=>{if(language!=='English')void import('./translations.json').then(module=>setTranslations(module.default));},[language]);
  const t=(text:string)=>language==='English'?text:translations[text]?.[language]||text;
  return <Context.Provider value={{language,setLanguage,t}}>{children}</Context.Provider>;
}
export const useLanguage=()=>useContext(Context);
export function UiText({text}:{text:string}){const {t}=useLanguage();return <>{t(text)}</>}
export function LanguagePicker(){const {language,setLanguage,t}=useLanguage();return <label className="office-language"><span>{t('Interface language')}</span><select aria-label={t('Interface language')} value={language} onChange={e=>setLanguage(e.target.value as InterfaceLanguage)}><option value="English">English</option><option value="Hindi">हिन्दी</option><option value="Hinglish">Hinglish</option></select></label>}
