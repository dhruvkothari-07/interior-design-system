import { useMemo } from 'react';

/**
 * Custom hook to centralize all quotation financial calculations
 * @param {Array} rooms - Array of room objects with materials
 * @param {number} laborCost - Labor cost value
 * @param {string} designFeeType - 'percentage' or 'flat'
 * @param {number} designFeeValue - Design fee value (percentage or flat amount)
 * @param {number} taxPercentage - Tax percentage (default: 18)
 * @returns {Object} Calculated values for quotation
 */
export const useQuotationCalculations = (
    rooms = [],
    laborCost = 0,
    designFeeType = 'percentage',
    designFeeValue = 0,
    taxPercentage = 18
) => {
    // Calculate total materials cost from all rooms
    const materialsTotal = useMemo(() => {
        return rooms.reduce((total, room) => {
            // If room has materials array, calculate from materials
            if (room.materials && Array.isArray(room.materials)) {
                const roomTotal = room.materials.reduce((roomSum, material) => {
                    return roomSum + (Number(material.price || 0) * Number(material.quantity || 0));
                }, 0);
                return total + roomTotal;
            }
            // Otherwise use room_total if available
            return total + (Number(room.room_total) || 0);
        }, 0);
    }, [rooms]);

    // Count total number of materials across all rooms
    const totalMaterialsCount = useMemo(() => {
        return rooms.reduce((count, room) => {
            return count + (room.materials?.length || 0);
        }, 0);
    }, [rooms]);

    // Calculate design fee based on type
    const calculatedDesignFee = useMemo(() => {
        const val = parseFloat(designFeeValue) || 0;
        if (designFeeType === 'flat') {
            return val;
        } else {
            // Percentage of (materials + labor)
            const base = materialsTotal + (parseFloat(laborCost) || 0);
            return (base * val) / 100;
        }
    }, [materialsTotal, laborCost, designFeeType, designFeeValue]);

    // Calculate subtotal (before tax)
    const taxableAmount = useMemo(() => {
        return materialsTotal + (parseFloat(laborCost) || 0) + calculatedDesignFee;
    }, [materialsTotal, laborCost, calculatedDesignFee]);

    // Calculate tax amount
    const taxAmount = useMemo(() => {
        return (taxableAmount * parseFloat(taxPercentage || 0)) / 100;
    }, [taxableAmount, taxPercentage]);

    // Calculate final total (with tax)
    const finalTotal = useMemo(() => {
        return taxableAmount + taxAmount;
    }, [taxableAmount, taxAmount]);

    return {
        materialsTotal,
        totalMaterialsCount,
        laborCostParsed: parseFloat(laborCost) || 0,
        calculatedDesignFee,
        taxableAmount,
        taxAmount,
        finalTotal
    };
};

export default useQuotationCalculations;
