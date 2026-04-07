import React from "react";
import { formatPeso, formatDatePH, formatReceiptNumber } from "@/lib/vat";
import type { CartItem, DiscountType } from "@/types";

interface ReceiptProps {
  storeInfo: {
    store_name: string;
    store_address: string;
    tin: string;
    vat_registered: boolean;
    ptu_number: string;
    ptu_valid_until: string;
    min: string;
    serial_number: string;
    accreditation_no: string;
    accreditation_valid_until: string;
  };
  transaction: {
    receipt_number: number;
    cashier_name: string;
    items: {
      product_name: string;
      quantity: number;
      unit_price: number;
      line_total: number;
    }[];
    subtotal: number;
    discount_amount: number;
    discount_type: string;
    discount_id_number?: string;
    discount_name?: string;
    vatable_sales: number;
    vat_amount: number;
    vat_exempt_sales: number;
    zero_rated_sales: number;
    total_amount: number;
    cash_received: number;
    change_amount: number;
    created_at: string;
  };
}

export default function Receipt({ storeInfo, transaction }: ReceiptProps) {
  if (!storeInfo || !transaction) return null;

  return (
    <div className="printable-receipt bg-white text-black font-mono text-xs w-[80mm] mx-auto p-4 hidden print:block">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="font-bold text-base leading-tight uppercase">{storeInfo.store_name}</h1>
        <p className="whitespace-pre-line">{storeInfo.store_address}</p>
        <p>VAT Reg TIN: {storeInfo.tin}</p>
        <p>MIN: {storeInfo.min}</p>
        <p>SN: {storeInfo.serial_number}</p>
      </div>

      {/* Transaction Info */}
      <div className="mb-3 border-b border-dashed border-black pb-2">
        <div className="flex justify-between">
          <span>Official Receipt:</span>
          <span className="font-bold">{formatReceiptNumber(transaction.receipt_number)}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{formatDatePH(transaction.created_at)}</span>
        </div>
        <div className="flex justify-between">
          <span>Cashier:</span>
          <span>{transaction.cashier_name}</span>
        </div>
      </div>

      {/* Items */}
      <div className="mb-3 border-b border-dashed border-black pb-2">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-dashed border-black">
              <th className="font-normal w-1/2">Item</th>
              <th className="font-normal text-right">Qty</th>
              <th className="font-normal text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {transaction.items.map((item, idx) => (
              <React.Fragment key={idx}>
                <tr>
                  <td colSpan={3} className="pt-1">{item.product_name}</td>
                </tr>
                <tr>
                  <td className="pl-2 text-gray-600">@ {formatPeso(item.unit_price)}</td>
                  <td className="text-right">{item.quantity}</td>
                  <td className="text-right">{formatPeso(item.line_total)}</td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="mb-3 border-b border-dashed border-black pb-2 space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatPeso(transaction.subtotal)}</span>
        </div>
        
        {transaction.discount_type !== "none" && transaction.discount_amount > 0 && (
          <div className="flex justify-between text-black">
            <span>Less: {transaction.discount_type.toUpperCase()} Disc.</span>
            <span>({formatPeso(transaction.discount_amount)})</span>
          </div>
        )}
        
        <div className="flex justify-between font-bold text-sm mt-1 border-t border-dashed border-black pt-1">
          <span>Amount Due:</span>
          <span>{formatPeso(transaction.total_amount)}</span>
        </div>
      </div>

      {/* Payment Information */}
      <div className="mb-4 border-b border-dashed border-black pb-2 space-y-1">
        <div className="flex justify-between">
          <span>Cash Given:</span>
          <span>{formatPeso(transaction.cash_received)}</span>
        </div>
        <div className="flex justify-between">
          <span>Change:</span>
          <span>{formatPeso(transaction.change_amount)}</span>
        </div>
      </div>

      {/* Tax Breakdown (BIR Mandatory) */}
      <div className="mb-4 border-b border-dashed border-black pb-2 space-y-1 text-[10px]">
        <div className="flex justify-between">
          <span>VATable Sales</span>
          <span>{formatPeso(transaction.vatable_sales)}</span>
        </div>
        <div className="flex justify-between">
          <span>VAT Amount (12%)</span>
          <span>{formatPeso(transaction.vat_amount)}</span>
        </div>
        <div className="flex justify-between">
          <span>VAT-Exempt Sales</span>
          <span>{formatPeso(transaction.vat_exempt_sales)}</span>
        </div>
        <div className="flex justify-between">
          <span>Zero-Rated Sales</span>
          <span>{formatPeso(transaction.zero_rated_sales)}</span>
        </div>
      </div>

      {/* Senior/PWD Footer info if applicable */}
      {transaction.discount_type !== 'none' && (
        <div className="mb-4 border-b border-dashed border-black pb-2 text-[10px]">
          <p>Name: {transaction.discount_name || 'N/A'}</p>
          <p>ID No: {transaction.discount_id_number}</p>
          <p>Signature: __________________________</p>
        </div>
      )}

      {/* BIR Footer */}
      <div className="text-center text-[10px] space-y-1">
        <p>THIS DOCUMENT IS NOT VALID FOR CLAIM OF INPUT TAX</p>
        <p>PTU No: {storeInfo.ptu_number}</p>
        <p>Date Issued: {formatDatePH(storeInfo.ptu_valid_until)}</p>
        {storeInfo.accreditation_no && (
          <>
            <p>Accreditation No: {storeInfo.accreditation_no}</p>
            <p>Valid Until: {formatDatePH(storeInfo.accreditation_valid_until)}</p>
          </>
        )}
        <p className="mt-2 font-bold">Thank you! Please come again.</p>
        <p className="mt-1">Powered by TindahanPOS</p>
      </div>
    </div>
  );
}
