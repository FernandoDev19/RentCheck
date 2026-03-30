export interface CreateRentalInterface {
  startDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  rentalStatus?: 'active' | 'returned' | 'late' | 'cancelled';
  vehicleId?: string;
}