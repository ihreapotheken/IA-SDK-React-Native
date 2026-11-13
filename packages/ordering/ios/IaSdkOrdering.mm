#import "IaSdkOrdering.h"
#import "IaSdkOrdering-Swift.h"

static void (^IaReject(RCTPromiseRejectBlock reject))(NSString *, NSString *) {
  return ^(NSString *code, NSString *message) {
    reject(code, message, nil);
  };
}

@implementation IaSdkOrdering

- (void)registerModule {
  [[IaSdkOrderingImpl shared] registerModule];
}

- (void)clearCart:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkOrderingImpl shared] clearCartWithResolve:resolve reject:IaReject(reject)];
}

- (void)transferPrescriptions:(NSDictionary *)params
                      resolve:(RCTPromiseResolveBlock)resolve
                       reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkOrderingImpl shared] transferPrescriptions:params resolve:resolve reject:IaReject(reject)];
}

- (void)getCartDetails:(BOOL)allowCached
  shouldEmitCartUpdate:(BOOL)shouldEmitCartUpdate
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkOrderingImpl shared] getCartDetails:allowCached
                        shouldEmitCartUpdate:shouldEmitCartUpdate
                                     resolve:resolve
                                      reject:IaReject(reject)];
}

- (void)deleteOrderHistory:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkOrderingImpl shared] deleteOrderHistoryWithResolve:resolve reject:IaReject(reject)];
}

// Run on the main thread: IACore (SDK 2.5.0+) asserts MainActor isolation.
- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeIaSdkOrderingSpecJSI>(params);
}

+ (NSString *)moduleName {
  return @"IaSdkOrdering";
}

@end
