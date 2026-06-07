const fs = require('fs');
const path = 'C:/Users/user/Desktop/washlab-customer-main/washlab-customer-main/app/(public)/order/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldStep4 = `          {/* Step 3: Branch & Delivery */}
          {currentStep === 4 && (
            <div className="animate-fade-in">
              <h2 className="text-lg sm:text-xl font-display font-semibold mb-4 sm:mb-6">Delivery Option</h2>
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="space-y-3">
                  <Label>Delivery Option</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setIsDelivery(false)}
                      className="p-4 rounded-xl border-2 transition-all text-left border-primary bg-primary/5"
                    >
                      <span className="font-medium block mb-1">Self Service</span>
                      <span className="text-xs text-muted-foreground">Drop off your laundry and pick it up yourself.</span>
                    </button>
                    {['Drop-off + Delivery', 'Pickup + Self Pick', 'Full Service'].map(option => (
                      <button key={option} disabled className="p-4 rounded-xl border-2 text-left border-border bg-muted/30 opacity-60 cursor-not-allowed relative">
                        <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-warning/20 text-warning border border-warning/30">
                          Coming soon
                        </span>
                        <span className="font-medium block mb-1 text-muted-foreground">{option}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-3 bg-muted/50 rounded-lg p-3">
                    Delivery and pickup services coming soon. WashLab currently operates as self-service only.
                  </p>
                </div>
              </div>
            </div>
          )}`;

const newStep4 = `          {/* Step 4: Delivery */}
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
                    <span className="text-xs text-muted-foreground">
                      We deliver to your door.
                      {branches.find(b => b._id === branchId)?.deliveryFee
                        ? \` +\u20b5\${branches.find(b => b._id === branchId).deliveryFee.toFixed(2)} fee.\`
                        : ''}
                    </span>
                  </button>
                </div>
                {isDelivery && (
                  <div className="space-y-4 p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl animate-fade-in">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">🚚 Delivery Details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="d-hall" className="text-xs mb-1.5 block">Hall / Hostel / Building *</Label>
                        <Input
                          id="d-hall"
                          value={customerInfo.hall}
                          onChange={e => setCustomerInfo(prev => ({ ...prev, hall: e.target.value }))}
                          placeholder="e.g. Republic Hall"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="d-room" className="text-xs mb-1.5 block">Room Number</Label>
                        <Input
                          id="d-room"
                          value={customerInfo.room}
                          onChange={e => setCustomerInfo(prev => ({ ...prev, room: e.target.value }))}
                          placeholder="e.g. A204"
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="d-address" className="text-xs mb-1.5 block">Full Address <span className="font-normal text-muted-foreground">(if off-campus)</span></Label>
                      <Input
                        id="d-address"
                        value={customerInfo.deliveryAddress}
                        onChange={e => setCustomerInfo(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                        placeholder="e.g. 45 Liberation Road, Accra"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="d-phone" className="text-xs mb-1.5 block">Delivery Phone <span className="font-normal text-muted-foreground">(if different)</span></Label>
                      <Input
                        id="d-phone"
                        value={customerInfo.deliveryPhone}
                        onChange={e => setCustomerInfo(prev => ({ ...prev, deliveryPhone: e.target.value }))}
                        placeholder="e.g. 0241234567"
                        className="text-sm"
                      />
                    </div>
                    {!customerInfo.hall && !customerInfo.deliveryAddress && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">\u26a0 Enter at least a hall/building or full address to continue</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}`;

if (content.includes(oldStep4)) {
  content = content.replace(oldStep4, newStep4);
  fs.writeFileSync(path, content, 'utf8');
  console.log('SUCCESS - Step 4 replaced');
} else {
  console.log('MARKER NOT FOUND - checking for Coming soon...');
  console.log('Contains Coming soon:', content.includes('Coming soon'));
  console.log('Contains Step 3: Branch', content.includes('Step 3: Branch'));
}
