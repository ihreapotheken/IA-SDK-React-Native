#import "IaSdkCardLink.h"
#import "IaSdkCardLink-Swift.h"

static void (^IaReject(RCTPromiseRejectBlock reject))(NSString *, NSString *) {
  return ^(NSString *code, NSString *message) {
    reject(code, message, nil);
  };
}

@implementation IaSdkCardLink {
  // Whether JS listens to any event. RCTEventEmitter drops events sent without
  // listeners and warns about each one in debug builds.
  _Atomic BOOL _hasListeners;
}

RCT_EXPORT_MODULE()

- (instancetype)init {
  self = [super init];
  if (self) {
    __weak IaSdkCardLink *weakSelf = self;
    void (^attach)(void) = ^{
      [[IaSdkCardLinkImpl shared] setEventEmitter:^(NSString *eventName, id body) {
        IaSdkCardLink *strongSelf = weakSelf;
        if (strongSelf && strongSelf->_hasListeners) {
          [strongSelf sendEventWithName:eventName body:body];
        }
      }];
    };
    // IaSdkCardLinkImpl is main-actor isolated, like the SDK it calls.
    if ([NSThread isMainThread]) {
      attach();
    } else {
      dispatch_async(dispatch_get_main_queue(), attach);
    }
  }
  return self;
}

// addListener:/removeListeners: come from RCTEventEmitter, which calls these
// when JS adds its first listener and removes its last one.
- (NSArray<NSString *> *)supportedEvents {
  return [IaSdkCardLinkImpl supportedEvents];
}

- (void)startObserving {
  _hasListeners = YES;
}

- (void)stopObserving {
  _hasListeners = NO;
}

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

// MARK: - Registration

- (void)registerModule {
  [[IaSdkCardLinkImpl shared] registerModule];
}

// MARK: - Launch

- (void)launch:(NSDictionary *)options resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCardLinkImpl shared] launch:options resolve:resolve reject:IaReject(reject)];
}

// MARK: - Getters

- (void)getVersion:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCardLinkImpl shared] getVersionWithResolve:resolve reject:IaReject(reject)];
}

- (void)getEnvironment:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCardLinkImpl shared] getEnvironmentWithResolve:resolve reject:IaReject(reject)];
}

- (void)getLogFilePath:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCardLinkImpl shared] getLogFilePathWithResolve:resolve reject:IaReject(reject)];
}

// MARK: - Card Management

- (void)getSavedCards:(NSString *)userId resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCardLinkImpl shared] getSavedCards:userId resolve:resolve reject:IaReject(reject)];
}

- (void)deleteCard:(NSString *)userId
          cardName:(NSString *)cardName
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCardLinkImpl shared] deleteCard:userId cardName:cardName resolve:resolve reject:IaReject(reject)];
}

- (void)deleteAllCards:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCardLinkImpl shared] deleteAllCardsWithResolve:resolve reject:IaReject(reject)];
}

- (void)deleteAllUserRelatedData:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCardLinkImpl shared] deleteAllUserRelatedDataWithResolve:resolve reject:IaReject(reject)];
}

- (void)updateCard:(NSDictionary *)params resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  reject(@"NOT_SUPPORTED", @"updateCard is only supported on Android.", nil);
}

- (void)reorderSavedCards:(NSString *)userId
          orderedCanCodes:(NSArray *)orderedCanCodes
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject {
  reject(@"NOT_SUPPORTED", @"reorderSavedCards is only supported on Android.", nil);
}

// MARK: - Other

- (void)setHostAppLogFilePath:(NSString *)path resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCardLinkImpl shared] setHostAppLogFilePath:path resolve:resolve reject:IaReject(reject)];
}

- (void)setMocks:(NSDictionary *)mocks resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCardLinkImpl shared] setMocks:mocks resolve:resolve reject:IaReject(reject)];
}

- (void)finish:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[IaSdkCardLinkImpl shared] finishWithResolve:resolve reject:IaReject(reject)];
}

// MARK: - TurboModule

// Run on the main thread: IACore (SDK 2.5.0+) asserts MainActor isolation.
- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeIaSdkCardLinkSpecJSI>(params);
}

@end
