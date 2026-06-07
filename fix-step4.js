const fs = require('fs');
const p = 'C:/Users/user/Desktop/washlab-customer-main/washlab-customer-main/app/(public)/order/page.tsx';
let content = fs.readFileSync(p, 'utf8');

const startMarker = '{/* Step 3: Branch & Delivery */}';
const endMarker = '{/* Step 4: Customer Details */}';

const start = content.indexOf(startMarker);
const end = content.indexOf(endMarker);

if (start === -1 || end === -1) {
  console.log('Markers not found. start:', start, 'end:', end);
  process.exit(1);
}

const newStep4 = `{/* Step 4: Delivery */}
          {currentStep === 4 && (
            <div className="animate-fade-in">
              <h2 className="text-lg sm:text-xl font-display font-semibold mb-2">How would you like it back?</h2>
              <p className="text-sm text-muted-foreground mb-6">Choose how you want to receive your laundry</p>
              <div className="max-w-md mx-auto space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsDelivery(false)}
                    className={\`p-5 rounded-2xl border-2 text-left transition-all \${!isDelivery ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}\`}
                  >
                    <span className="text-2xl mb-2 block">🏃</span>
                    <span className="font-semibold block mb-1">Self Pickup</span>
                    <span className="text-xs text-muted-foreground">Come collect your laundry from the branch when ready.</span>
                  </button>
                  <button
                    onClick={() => setIsDelivery(true)}
                    className={\`p-5 rounded-2xl border-2 text-left transition-all \${isDelivery ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}\`}
                  >
                    <span className="text-2xl mb-2 block">🚚</span>
                    <span className="font-semibold block mb-1">Delivery</span>
                    <span className="text-xs text-muted-foreground">We deliver to your door.</span>
                  </button>
                </div>
                {isDelivery && (
                  <div className="space-y-4 p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">🚚 Delivery Details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="d-hall" className="text-xs mb-1.5 block">Hall / Hostel / Building *</Label>
                        <Input id="d-hall" value={customerInfo.hall} onChange={e => setCustomerInfo(prev => ({ ...prev, hall: e.target.value }))} placeholder="e.g. Republic Hall" className="text-sm" />
                      </div>
                      <div>
                        <Label htmlFor="d-room" className="text-xs mb-1.5 block">Room Number</Label>
                        <Input id="d-room" value={customerInfo.room} onChange={e => setCustomerInfo(prev => ({ ...prev, room: e.target.value }))} placeholder="e.g. A204" className="text-sm" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="d-address" className="text-xs mb-1.5 block">Full Address <span className="font-normal text-muted-foreground">(if off-campus)</span></Label>
                      <Input id="d-address" value={customerInfo.deliveryAddress} onChange={e => setCustomerInfo(prev => ({ ...prev, deliveryAddress: e.target.value }))} placeholder="e.g. 45 Liberation Road, Accra" className="text-sm" />
                    </div>
                    <div>
                      <Label htmlFor="d-phone" className="text-xs mb-1.5 block">Delivery Phone <span className="font-normal text-muted-foreground">(if different)</span></Label>
                      <Input id="d-phone" value={customerInfo.deliveryPhone} onChange={e => setCustomerInfo(prev => ({ ...prev, deliveryPhone: e.target.value }))} placeholder="e.g. 0241234567" className="text-sm" />
                    </div>
                    {!customerInfo.hall && !customerInfo.deliveryAddress && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">Enter at least a hall/building or full address</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          `;

content = content.substring(0, start) + newStep4 + content.substring(end);
fs.writeFileSync(p, content, 'utf8');
console.log('SUCCESS');
