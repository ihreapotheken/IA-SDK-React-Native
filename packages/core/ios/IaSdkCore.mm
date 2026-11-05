#import "IaSdkCore.h"
#import "IaSdkCore-Swift.h"

/// Adapts an RCTPromiseRejectBlock to the (code, message) block the Swift
/// implementation takes.
static void (^IaReject(RCTPromiseRejectBlock reject))(NSString *, NSString *) {
  return ^(NSString *code, NSString *message) {
    reject(code, message, nil);
  };
}

@implementation IaSdkCore

- (instancetype)init {
  self = [super init];
  if (self) {
    __weak IaSdkCore *weakSelf = self;
    void (^attach)(void) = ^{
      [[IaSdkCoreImpl shared] attachWithEmitter:^(NSString *eventName, id body) {
        [weakSelf sendEventWithName:eventName body:body];
      }];
    };
    // IaSdkCoreImpl is main-actor isolated, like the SDK it calls.
    if ([NSThread isMainThread]) {
      attach();
    } else {
      dispatch_async(dispatch_get_main_queue(), attach);
    }
  }
  return self;
}

- (NSArray<NSString *> *)supportedEvents {
  return [IaSdkCoreImpl supportedEvents];
}

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

// The ia.de SDK (IACore) APIs are @MainActor-isolated and assert main-thread
// execution at runtime (SDK 2.5.0+). React Native invokes TurboModule methods
// on a background queue by default, so this module's methods run on the main
// queue.
- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

// MARK: - Native-to-JS requests

- (void)setRequestHandlerEnabled:(NSString *)type enabled:(BOOL)enabled {
  [[IaSdkCoreImpl shared] setRequestHandlerEnabled:type enabled:enabled];
}

- (void)respondToRequest:(NSString *)requestId response:(NSDictionary *)response {
  [[IaSdkCoreImpl shared] respondToRequest:requestId response:response];
}

// MARK: - Initialization and user data

- (void)initialize:(NSDictionary *)config resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCoreImpl shared] initialize:config resolve:resolve reject:IaReject(reject)];
}

- (void)logout:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCoreImpl shared] logoutWithResolve:resolve reject:IaReject(reject)];
}

- (void)setGuestUserData:(NSDictionary *)data resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCoreImpl shared] setGuestUserData:data resolve:resolve reject:IaReject(reject)];
}

- (void)setUserBillingAddress:(NSDictionary *)address resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCoreImpl shared] setUserBillingAddress:address resolve:resolve reject:IaReject(reject)];
}

- (void)setUserDeliveryAddress:(NSDictionary *)address resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCoreImpl shared] setUserDeliveryAddress:address resolve:resolve reject:IaReject(reject)];
}

- (void)clearUserBillingAddress:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCoreImpl shared] clearUserBillingAddressWithResolve:resolve reject:IaReject(reject)];
}

- (void)clearUserDeliveryAddress:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCoreImpl shared] clearUserDeliveryAddressWithResolve:resolve reject:IaReject(reject)];
}

- (void)deleteUser:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCoreImpl shared] deleteUserWithResolve:resolve reject:IaReject(reject)];
}

// MARK: - Screens

- (void)launchScreen:(NSString *)screen
             options:(NSDictionary *)options
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCoreImpl shared] launchScreen:screen options:options resolve:resolve reject:IaReject(reject)];
}

- (void)finishAllActivities:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCoreImpl shared] finishAllActivitiesWithResolve:resolve reject:IaReject(reject)];
}

- (void)setPrescriptionScannerCameraState:(NSDictionary *)state
                                  resolve:(RCTPromiseResolveBlock)resolve
                                   reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCoreImpl shared] setPrescriptionScannerCameraState:state resolve:resolve reject:IaReject(reject)];
}

// MARK: - State

- (void)transferSDKv1UserData:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCoreImpl shared] transferSDKv1UserDataWithResolve:resolve reject:IaReject(reject)];
}

- (void)isInitialized:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCoreImpl shared] isInitializedWithResolve:resolve reject:IaReject(reject)];
}

- (void)getInitializationState:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCoreImpl shared] getInitializationStateWithResolve:resolve reject:IaReject(reject)];
}

- (void)getEnvironment:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCoreImpl shared] getEnvironmentWithResolve:resolve reject:IaReject(reject)];
}

- (void)cleanCache:(BOOL)initialization
     prerequisites:(BOOL)prerequisites
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCoreImpl shared] cleanCache:initialization prerequisites:prerequisites resolve:resolve reject:IaReject(reject)];
}

- (void)setShouldShowMascotIllustrations:(BOOL)value resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCoreImpl shared] setShouldShowMascotIllustrations:value resolve:resolve reject:IaReject(reject)];
}

// MARK: - Prerequisites

- (void)resetPrerequisites:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCoreImpl shared] resetPrerequisitesWithResolve:resolve reject:IaReject(reject)];
}

- (void)resetLegalDisclaimer:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCoreImpl shared] resetLegalDisclaimerWithResolve:resolve reject:IaReject(reject)];
}

- (void)resetAnalyticsConsent:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCoreImpl shared] resetAnalyticsConsentWithResolve:resolve reject:IaReject(reject)];
}

- (void)setIsOnboardingShown:(BOOL)value resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCoreImpl shared] setIsOnboardingShown:value resolve:resolve reject:IaReject(reject)];
}

- (void)isPrerequisiteFlowCompleted:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCoreImpl shared] isPrerequisiteFlowCompletedWithResolve:resolve reject:IaReject(reject)];
}

- (void)launchPrerequisiteFlow:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCoreImpl shared] launchPrerequisiteFlowWithResolve:resolve reject:IaReject(reject)];
}

- (void)legacySetupAsCoreApp:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCoreImpl shared] legacySetupAsCoreAppWithResolve:resolve reject:IaReject(reject)];
}

// MARK: - Debugging

- (void)presentLogs:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCoreImpl shared] presentLogsWithResolve:resolve reject:IaReject(reject)];
}

- (void)getUserId:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCoreImpl shared] getUserIdWithResolve:resolve reject:IaReject(reject)];
}

- (void)removeAllCachedResponses:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCoreImpl shared] removeAllCachedResponsesWithResolve:resolve reject:IaReject(reject)];
}

- (void)setLogMessageForwardingEnabled:(BOOL)enabled {
  [[IaSdkCoreImpl shared] setLogMessageForwardingEnabled:enabled];
}

// MARK: - Android only

- (void)setHapticFeedbackEnabled:(BOOL)enabled resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  reject(@"NOT_SUPPORTED", @"setHapticFeedbackEnabled is only supported on Android.", nil);
}

- (void)exportLogs:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  reject(@"NOT_SUPPORTED", @"exportLogs is only supported on Android.", nil);
}

// MARK: - TurboModule

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeIaSdkCoreSpecJSI>(params);
}

+ (NSString *)moduleName {
  return @"IaSdkCore";
}

@end
