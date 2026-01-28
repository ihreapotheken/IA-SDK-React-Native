#import "IaSdkPrescription.h"
#import "IaSdkPrescription-Swift.h"

@implementation IaSdkPrescription

- (void)registerModule {
  [[IaSdkPrescriptionImpl shared] registerModule];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeIaSdkPrescriptionSpecJSI>(params);
}

+ (NSString *)moduleName {
  return @"IaSdkPrescription";
}

@end
