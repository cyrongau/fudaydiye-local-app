import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface IconPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (icon: string) => void;
}

const MATERIAL_ICONS = [
    // Commerce & Shopping
    'shopping_bag', 'shopping_cart', 'store', 'storefront', 'local_offer', 'sell', 'percent', 'attach_money', 'credit_card', 'receipt', 'wallet', 'loyalty', 'local_mall', 'qr_code', 'barcode',

    // Fashion & Apparel
    'checkroom', 'styler', 'dry_cleaning', 'diamond', 'watch', 'do_not_step', 'steps', 'man', 'woman', 'child_care',

    // Electronics & Gadgets
    'devices', 'phone_iphone', 'laptop_mac', 'headphones', 'watch', 'camera_alt', 'videogame_asset', 'mouse', 'keyboard', 'memory', 'router', 'speaker', 'tv', 'battery_charging_full', 'toys',

    // Home & Living
    'home', 'chair', 'bed', 'living', 'kitchen', 'light', 'table_restaurant', 'door_front', 'blinds', 'sensor_door', 'yard', 'balcony', 'garage', 'bathtub', 'weekend',

    // Food & Dining
    'restaurant', 'restaurant_menu', 'lunch_dining', 'local_cafe', 'local_pizza', 'bakery_dining', 'liquor', 'icecream', 'ramen_dining', 'kitchen', 'fastfood', 'cake', 'egg', 'soup_kitchen', 'local_bar',

    // Health & Beauty
    'face', 'face_3', 'health_and_safety', 'spa', 'fitness_center', 'self_improvement', 'medical_services', 'medication', 'monitor_heart', 'clean_hands', 'soap', 'healing', 'psychology',

    // Services & Tools
    'build', 'construction', 'plumbing', 'content_cut', 'cleaning_services', 'local_shipping', 'local_taxi', 'flights', 'hotel', 'local_gas_station', 'car_repair', 'electric_bolt', 'lock', 'key',

    // Education & Books
    'school', 'menu_book', 'library_books', 'auto_stories', 'history_edu', 'edit', 'brush', 'palette', 'architecture', 'science', 'biotech', 'calculate',

    // Entertainment & Art
    'movie', 'music_note', 'piano', 'sports_esports', 'palette', 'camera', 'videocam', 'theater_comedy', 'stadium', 'sports_soccer', 'sports_basketball', 'sports_tennis',

    // General & UI
    'category', 'widgets', 'grid_view', 'list', 'star', 'favorite', 'verified', 'bolt', 'eco', 'water_drop', 'pets', 'flight', 'rocket', 'public', 'language'
];

const IconPickerModal: React.FC<IconPickerModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [search, setSearch] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !mounted) return null;

    const filteredIcons = MATERIAL_ICONS.filter(icon => icon.includes(search.toLowerCase()));

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            ></div>

            <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-surface-dark rounded-[32px] p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-white/10 flex flex-col max-h-[85vh]">

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-black text-secondary dark:text-white uppercase tracking-tighter">Select Icon</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Choose a symbol for this node</p>
                    </div>
                    <button onClick={onClose} className="size-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center hover:bg-gray-100 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="relative mb-6">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">search</span>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search icons..."
                        className="w-full h-12 bg-gray-50 dark:bg-black/20 rounded-xl pl-12 pr-4 text-sm font-bold border border-transparent focus:border-primary transition-all outline-none"
                        autoFocus
                    />
                </div>

                <div className="overflow-y-auto pr-2 grid grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {filteredIcons.map(icon => (
                        <button
                            key={icon}
                            onClick={() => { onSelect(icon); onClose(); }}
                            className="aspect-square rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-primary hover:text-white flex flex-col items-center justify-center gap-1 transition-all group"
                        >
                            <span className="material-symbols-outlined text-2xl">{icon}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default IconPickerModal;
