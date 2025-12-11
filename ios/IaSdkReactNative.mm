#import "IaSdkReactNative.h"
#import "IaSdkReactNative-Swift.h"

@implementation IaSdkReactNative

- (void)initIaSdkIOS:(NSString *)accessKey
               clientId:(NSString *)clientId
    serverEnvironmentId:(NSString *)serverEnvironmentId
      completionHandler:(RCTResponseSenderBlock)completion {
  [[IaSdkReactNativeImpl shared] initIaSdkIOS:accessKey
                                     clientId:clientId
                          serverEnvironmentId:serverEnvironmentId
                            completionHandler:^(NSString *err) {
                              completion(@[ err ?: [NSNull null] ]);
                            }];
}

- (void)configureIaSdkWithFooterShouldShowDataProcessing:
    (BOOL)footerShouldShowDataProcessing {
  [[IaSdkReactNativeImpl shared]
      configureIaSdkWithFooterShouldShowDataProcessing:YES];
}

- (void)setGuestUserDataIOS:(NSString *)salutation
                        firstName:(NSString *)firstName
                         lastName:(NSString *)lastName
                            email:(NSString *)email
           phoneNumberCountryCode:(NSNumber *)phoneNumberCountryCode
    phoneNumberWithoutCountryCode:(NSNumber *)phoneNumberWithoutCountryCode
                completionHandler:(RCTResponseSenderBlock)completion {
  NSInteger countryCode = [phoneNumberCountryCode integerValue];
  NSInteger number = [phoneNumberWithoutCountryCode integerValue];
  [[IaSdkReactNativeImpl shared] setGuestUserDataIOS:salutation
                                           firstName:firstName
                                            lastName:lastName
                                               email:email
                              phoneNumberCountryCode:countryCode
                       phoneNumberWithoutCountryCode:number
                                   completionHandler:^(NSString *err) {
                                     completion(@[ err ?: [NSNull null] ]);
                                   }];
}

- (void)startDashboardActivityIOS {
  [[IaSdkReactNativeImpl shared] startDashboardActivityIOS];
}

- (void)logoutIOS:(RCTResponseSenderBlock)completion {
  [[IaSdkReactNativeImpl shared] logoutIOS:^(NSString *err) {
    completion(@[ err ?: [NSNull null] ]);
  }];
}

- (void)clearCartIOS:(RCTResponseSenderBlock)completion {
  [[IaSdkReactNativeImpl shared] clearCartIOS:^(NSString *err) {
    completion(@[ err ?: [NSNull null] ]);
  }];
}

- (void)transferPrescriptionsIOS:(NSArray<NSString *> *)images
                            pdfs:(NSArray<NSString *> *)pdfs
                           codes:(NSArray<NSString *> *)codes
                         orderId:(NSString *)orderId
               completionHandler:(RCTResponseSenderBlock)completion {
  [[IaSdkReactNativeImpl shared] transferPrescriptionsIOS:images
                                                     pdfs:pdfs
                                                    codes:codes
                                                  orderId:orderId
                                        completionHandler:^(NSString *err) {
                                          completion(@[ err ?: [NSNull null] ]);
                                        }];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeIaSdkReactNativeSpecJSI>(
      params);
}

+ (NSString *)moduleName {
  return @"IaSdkReactNative";
}

@end
