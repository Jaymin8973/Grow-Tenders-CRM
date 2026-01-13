// GEM Portal Categories - Government e-Marketplace
export const GEM_CATEGORIES = [
    // IT & Technology
    { id: 'it_services', name: 'IT Services', group: 'Technology' },
    { id: 'software', name: 'Software & Licensing', group: 'Technology' },
    { id: 'computer_hardware', name: 'Computer Hardware', group: 'Technology' },
    { id: 'networking', name: 'Networking Equipment', group: 'Technology' },
    { id: 'cloud_services', name: 'Cloud Services', group: 'Technology' },
    { id: 'cybersecurity', name: 'Cybersecurity', group: 'Technology' },

    // Construction & Infrastructure
    { id: 'civil_construction', name: 'Civil Construction', group: 'Construction' },
    { id: 'electrical_works', name: 'Electrical Works', group: 'Construction' },
    { id: 'plumbing', name: 'Plumbing & Sanitary', group: 'Construction' },
    { id: 'road_construction', name: 'Road Construction', group: 'Construction' },
    { id: 'building_maintenance', name: 'Building Maintenance', group: 'Construction' },

    // Office & Stationery
    { id: 'office_equipment', name: 'Office Equipment', group: 'Office' },
    { id: 'furniture', name: 'Furniture', group: 'Office' },
    { id: 'stationery', name: 'Stationery & Supplies', group: 'Office' },
    { id: 'printing', name: 'Printing Services', group: 'Office' },

    // Healthcare & Medical
    { id: 'medical_equipment', name: 'Medical Equipment', group: 'Healthcare' },
    { id: 'pharmaceuticals', name: 'Pharmaceuticals', group: 'Healthcare' },
    { id: 'hospital_supplies', name: 'Hospital Supplies', group: 'Healthcare' },
    { id: 'lab_equipment', name: 'Laboratory Equipment', group: 'Healthcare' },

    // Transport & Vehicles
    { id: 'vehicles', name: 'Vehicles', group: 'Transport' },
    { id: 'vehicle_spare_parts', name: 'Vehicle Spare Parts', group: 'Transport' },
    { id: 'fleet_management', name: 'Fleet Management', group: 'Transport' },
    { id: 'logistics', name: 'Logistics & Courier', group: 'Transport' },

    // Security
    { id: 'security_services', name: 'Security Services', group: 'Security' },
    { id: 'surveillance', name: 'Surveillance & CCTV', group: 'Security' },
    { id: 'fire_safety', name: 'Fire Safety Equipment', group: 'Security' },

    // Energy & Power
    { id: 'solar_energy', name: 'Solar Energy', group: 'Energy' },
    { id: 'electrical_equipment', name: 'Electrical Equipment', group: 'Energy' },
    { id: 'power_backup', name: 'Power Backup (UPS/Generator)', group: 'Energy' },

    // Consulting & Professional
    { id: 'consulting', name: 'Consulting Services', group: 'Professional' },
    { id: 'legal_services', name: 'Legal Services', group: 'Professional' },
    { id: 'hr_services', name: 'HR & Manpower', group: 'Professional' },
    { id: 'training', name: 'Training & Development', group: 'Professional' },
    { id: 'audit_services', name: 'Audit & Accounting', group: 'Professional' },

    // Agriculture
    { id: 'agriculture_equipment', name: 'Agriculture Equipment', group: 'Agriculture' },
    { id: 'fertilizers', name: 'Fertilizers & Chemicals', group: 'Agriculture' },
    { id: 'seeds_plants', name: 'Seeds & Plants', group: 'Agriculture' },

    // Textiles & Uniforms
    { id: 'uniforms', name: 'Uniforms & Clothing', group: 'Textiles' },
    { id: 'fabrics', name: 'Fabrics & Textiles', group: 'Textiles' },

    // Food & Catering
    { id: 'catering', name: 'Catering Services', group: 'Food' },
    { id: 'food_supplies', name: 'Food Supplies', group: 'Food' },
    { id: 'kitchen_equipment', name: 'Kitchen Equipment', group: 'Food' },

    // Cleaning & Housekeeping
    { id: 'housekeeping', name: 'Housekeeping Services', group: 'Cleaning' },
    { id: 'cleaning_supplies', name: 'Cleaning Supplies', group: 'Cleaning' },
    { id: 'waste_management', name: 'Waste Management', group: 'Cleaning' },

    // Miscellaneous
    { id: 'event_management', name: 'Event Management', group: 'Misc' },
    { id: 'advertising', name: 'Advertising & Marketing', group: 'Misc' },
    { id: 'packaging', name: 'Packaging & Materials', group: 'Misc' },
    { id: 'scientific_instruments', name: 'Scientific Instruments', group: 'Misc' },
];

// Get unique groups for filtering
export const CATEGORY_GROUPS = [...new Set(GEM_CATEGORIES.map(c => c.group))];

// Helper function to get categories by group
export function getCategoriesByGroup(group: string) {
    return GEM_CATEGORIES.filter(c => c.group === group);
}
