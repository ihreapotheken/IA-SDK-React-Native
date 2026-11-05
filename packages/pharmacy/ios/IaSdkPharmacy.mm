#import "IaSdkPharmacy.h"
#import "IaSdkPharmacy-Swift.h"

static void (^IaReject(RCTPromiseRejectBlock reject))(NSString *, NSString *) {
  return ^(NSString *code, NSString *message) {
    reject(code, message, nil);
  };
}

@implementation IaSdkPharmacy

- (void)registerModule {
  [[IaSdkPharmacyImpl shared] registerModule];
}

- (void)setPharmacyId:(NSString *)pharmacyId resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkPharmacyImpl shared] setPharmacyId:pharmacyId resolve:resolve reject:IaReject(reject)];
}

- (void)savePharmacyId:(NSString *)pharmacyId resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkPharmacyImpl shared] savePharmacyId:pharmacyId resolve:resolve reject:IaReject(reject)];
}

- (void)getPharmacyId:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkPharmacyImpl shared] getPharmacyIdWithResolve:resolve reject:IaReject(reject)];
}

- (void)clearPharmacyId:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkPharmacyImpl shared] clearPharmacyIdWithResolve:resolve reject:IaReject(reject)];
}

- (void)getPharmacy:(BOOL)allowCached resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkPharmacyImpl shared] getPharmacy:allowCached resolve:resolve reject:IaReject(reject)];
}

// Run on the main thread: IACore (SDK 2.5.0+) asserts MainActor isolation.
- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeIaSdkPharmacySpecJSI>(params);
}

+ (NSString *)moduleName {
  return @"IaSdkPharmacy";
}

@end
