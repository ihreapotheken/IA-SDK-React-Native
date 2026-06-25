#import "IaSdkPharmacy.h"
#import "IaSdkPharmacy-Swift.h"

@implementation IaSdkPharmacy

- (void)registerModule {
  [[IaSdkPharmacyImpl shared] registerModule];
}

- (void)launchPharmacyDetailsIOS {
  [[IaSdkPharmacyImpl shared] launchPharmacyDetailsIOS];
}

- (void)setPharmacyIdIOS:(NSString *)pharmacyId {
  [[IaSdkPharmacyImpl shared] setPharmacyIdIOS:pharmacyId];
}

- (void)getPharmacyIdIOS:(RCTResponseSenderBlock)completion {
  [[IaSdkPharmacyImpl shared] getPharmacyIdIOS:^(NSString *result) {
    completion(@[ result ?: [NSNull null] ]);
  }];
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
