
import React from 'react';

export type DocumentType = 'INVOICE' | 'PACKING_SLIP' | 'SHIPPING_RECEIPT';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: DocumentType;
  data: {
    id: string;
    date: string;
    customer?: string;
    vendor?: string;
    vendorAddress?: string;
    vendorPhone?: string;
    vendorEmail?: string;
    amount?: string;
    items?: any[];
    location?: string;
    size?: string;
  };
}

const DocumentModal: React.FC<DocumentModalProps> = ({ isOpen, onClose, type, data }) => {
  if (!isOpen) return null;

  const handleDownload = async () => {
    const btn = document.getElementById('download-btn');
    const content = document.getElementById('document-content');

    if (btn && content) {
      const originalText = btn.innerHTML;
      try {
        btn.innerHTML = '<span class="animate-spin material-symbols-outlined">sync</span> Generating PDF...';

        // Dynamic import to avoid SSR/build issues if used in non-browser env (though this is client-side)
        const html2canvas = (await import('html2canvas')).default;
        const { jsPDF } = await import('jspdf');

        const canvas = await html2canvas(content, {
          scale: 2,
          logging: false,
          useCORS: true,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`Fudaydiye_${type}_${data.id}.pdf`);

        btn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Downloaded';
        setTimeout(() => {
          btn.innerHTML = originalText;
          onClose();
        }, 1500);

      } catch (err) {
        console.error("PDF Generation Failed", err);
        btn.innerHTML = '<span class="material-symbols-outlined">error</span> Failed';
        setTimeout(() => { btn.innerHTML = originalText; }, 2000);
      }
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'INVOICE': return 'Payment Invoice';
      case 'PACKING_SLIP': return 'Packing Slip';
      case 'SHIPPING_RECEIPT': return 'Shipping Receipt';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>

      <div className="relative w-full md:max-w-sm bg-white rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* Header Controls */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xs font-black text-secondary uppercase tracking-widest">{getTitle()}</h3>
          <button onClick={onClose} className="size-8 rounded-full bg-white flex items-center justify-center text-gray-400 shadow-sm">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Document Content (Simulated A4/Receipt) */}
        <div id="document-content" className="p-8 bg-white text-secondary font-display">
          <div className="flex justify-between items-start mb-8 border-b-2 border-primary pb-6">
            <div className="flex items-center gap-4">
              <img src="/logo192.png" alt="Fudaydiye" className="size-16 object-contain" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter leading-none text-secondary">Fudaydiye</h2>
                <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Commerce Grid</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Headquarters</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Omar Haashi Building, Floor 02</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase">Hargeisa, Somalia</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">+252 63 8555590</p>
              <p className="text-[9px] font-bold text-gray-400 mt-0.5">info@fudaydiye.com</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between border-b border-gray-50 pb-4">
              <div>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Doc ID</p>
                <p className="text-xs font-black">#{data.id}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Issue Date</p>
                <p className="text-xs font-black">{data.date}</p>
              </div>
            </div>

            <div>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Entity Details</p>
              <div className="space-y-1">
                {data.vendor && (
                  <div className="mb-2">
                    <p className="text-xs font-bold text-secondary">Vendor: {data.vendor}</p>
                    {/* Show Secondary Vendor Address if provided and different from Fudaydiye */}
                    {data.vendorAddress && (
                      <p className="text-[10px] font-medium text-gray-500">{data.vendorAddress}</p>
                    )}
                  </div>
                )}
                {data.customer && <p className="text-xs font-bold text-secondary">Customer: {data.customer}</p>}
                {data.location && <p className="text-xs font-medium text-gray-500">Destination: {data.location}</p>}
                {data.size && <p className="text-xs font-medium text-gray-500">Package Volume: {data.size}</p>}
              </div>
            </div>

            <div>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3">Line Items</p>
              <div className="space-y-3">
                {(data.items || [{ name: 'Standard Logistics Service', price: data.amount || '$0.00' }]).map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="font-bold">{item.name} {item.qty ? `x${item.qty}` : ''}</span>
                    <span className="font-black">{item.price}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t-2 border-dashed border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest">Total Amount</span>
                <span className="text-xl font-black text-primary">{data.amount || '$0.00'}</span>
              </div>
            </div>

            <div className="flex justify-center pt-6">
              <div className="px-4 py-2 border border-gray-100 rounded-lg flex items-center gap-2 opacity-40">
                <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
                <span className="text-[8px] font-black uppercase tracking-[0.2em]">Verified Blockchain ID</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 flex gap-3">
          <button
            id="download-btn"
            onClick={handleDownload}
            className="flex-1 h-14 bg-secondary text-primary font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            Save as PDF
          </button>
          <button className="size-14 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 active:scale-95 transition-all">
            <span className="material-symbols-outlined">print</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentModal;
