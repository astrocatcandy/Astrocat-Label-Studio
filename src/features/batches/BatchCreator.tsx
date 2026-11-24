import {useEffect,useMemo,useState} from 'react';
import type {Product,Batch} from '../../types/models';
import {addMonths,makeBatchNumber} from '../../lib/date';
import {canPrint,validateProduct} from '../validation/validate';
import {randomSlogan} from '../slogans/slogans';
interface Props{products:Product[];batches:Batch[];onSave:(b:Batch)=>Promise<void>}
export function BatchCreator({products,batches,onSave}:Props){const [productSearch, setProductSearch] = useState('');const [productId,setProductId]=useState(products[0]?.id||'');const [productionDate,setProductionDate]=useState(new Date().toLocaleDateString('en-CA'));const [bestBefore,setBestBefore]=useState('');const [quantity,setQuantity]=useState(1);const [originalProduct,setOriginalProduct]=useState('');const [manufacturerLot,setManufacturerLot]=useState('');const [originalBestBefore,setOriginalBestBefore]=useState('');const [notes,setNotes]=useState('');const [busy,setBusy]=useState(false);const product=products.find(p=>p.id===productId);
const terms = productSearch.trim().toLocaleLowerCase('de').split(/\s+/);
const visibleProducts = products.filter(({ name, sku }) => {
  const text = `${name} ${sku}`.toLocaleLowerCase('de');
  return terms.every(term => text.includes(term));
});
const number=useMemo(()=>product?makeBatchNumber(product.sku,productionDate,batches.map(b=>b.number)):'',[product,productionDate,batches]);useEffect(()=>{if(product)setBestBefore(addMonths(productionDate,product.shelfLifeMonths))},[productionDate,productId,product?.shelfLifeMonths]);return <section className="panel"><div className="section-title"><h2>Neue Charge erstellen</h2><span className="tag">Automatische Nummer</span></div>{products.length===0?<p>Lege zuerst ein Produkt an.</p>:<><div className="label-batch-picker">
  <label className="field">
    <span>Produkt suchen</span>
    <input type="search" value={productSearch} onChange={event => setProductSearch(event.target.value)} placeholder="Produktname oder SKU" />
  </label>
  <fieldset className="label-batch-list">
    <legend>Produkt auswählen</legend>
    <div className="label-batch-grid">
      {visibleProducts.map(item => (
        <label className="label-batch-option" key={item.id}>
          <input type="radio" name="new-batch-product" checked={productId === item.id} onChange={() => setProductId(item.id)} />
          <span><strong>{item.name}</strong><small>{item.sku}</small></span>
        </label>
      ))}
    </div>
    {visibleProducts.length === 0 && <p className="hint">Kein passendes Produkt gefunden.</p>}
  </fieldset>
  {product && <p className="hint"><strong>Ausgewähltes Produkt:</strong> {product.name} · {product.sku}</p>}
</div>
<div className="form-grid"><label className="field"><span>Produktionsdatum</span><input type="date" value={productionDate} onChange={e=>setProductionDate(e.target.value)}/></label><label className="field"><span>MHD (Vorschlag, selbst prüfen)</span><input type="date" value={bestBefore} onChange={e=>setBestBefore(e.target.value)}/></label><label className="field"><span>Etikettenanzahl</span><input type="number" min="1" max="500" value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/></label></div><div className="source-panel"><h3>Verwendetes Originalprodukt / Rückverfolgbarkeit</h3><p className="hint">Nur intern gespeichert – diese Angaben erscheinen nicht auf dem Etikett.</p><div className="form-grid"><label className="field"><span>Originalprodukt / Hersteller</span><input value={originalProduct} onChange={e=>setOriginalProduct(e.target.value)} placeholder="z. B. Skittles – Mars"/></label><label className="field"><span>Hersteller-Losnummer</span><input value={manufacturerLot} onChange={e=>setManufacturerLot(e.target.value)} placeholder="Losnummer der Originalverpackung"/></label><label className="field"><span>MHD der Originalverpackung</span><input type="date" value={originalBestBefore} onChange={e=>setOriginalBestBefore(e.target.value)}/></label><label className="field"><span>Notizen / Einkaufsort (optional)</span><input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="z. B. Händler und Menge"/></label></div></div><div className="batch-number"><span>Neue Chargennummer</span><strong>{number}</strong><small>Eindeutig pro Produktionstag über alle Produkte</small></div>{product&&!canPrint(product)&&<div className="issue warning">Druck erst nach Produktprüfung möglich. {validateProduct(product).filter(i=>i.severity==='error').map(i=>i.message).join(' ')}</div>}<div className="actions"><button className="btn primary" disabled={busy||!product||!productionDate||!bestBefore||quantity<1||quantity>500} onClick={async()=>{if(!product)return;setBusy(true);try{await onSave({id:crypto.randomUUID(),productId:product.id,number,productionDate,bestBefore,quantity,slogan:randomSlogan(),source:{originalProduct:originalProduct.trim(),manufacturerLot:manufacturerLot.trim(),originalBestBefore,notes:notes.trim()},createdAt:new Date().toISOString(),productSnapshot:structuredClone(product)})}finally{setBusy(false)}}}>Charge speichern</button></div></>}</section>}
