#import "IaSdkOrdering.h"
#import "IaSdkOrdering-Swift.h"

@implementation IaSdkOrdering

- (void)registerModule {
  [[IaSdkOrderingImpl shared] registerModule];
}

- (void)clearCartIOS:(RCTResponseSenderBlock)completion {
  [[IaSdkOrderingImpl shared] clearCartIOS:^(NSString *err) {
    completion(@[ err ?: [NSNull null] ]);
  }];
}

- (void)transferPrescriptionsIOS:(NSArray<NSString *> *)images
                            pdfs:(NSArray<NSDictionary *> *)pdfs
                           codes:(NSArray<NSString *> *)codes
                         orderId:(NSString *)orderId
               completionHandler:(RCTResponseSenderBlock)completion {
  [[IaSdkOrderingImpl shared] transferPrescriptionsIOS:images
                                                   pdfs:pdfs
                                                  codes:codes
                                                orderId:orderId
                                      completionHandler:^(NSString *err) {
                                        completion(@[ err ?: [NSNull null] ]);
                                      }];
}

- (void)launchCartScreenIOS {
  [[IaSdkOrderingImpl shared] launchCartScreenIOS];
}

- (void)getCartDetailsIOS:(RCTResponseSenderBlock)completion {
  [[IaSdkOrderingImpl shared] getCartDetailsIOS:^(NSString *result) {
    completion(@[ result ?: [NSNull null] ]);
  }];
}

- (void)deleteOrderHistoryIOS:(RCTResponseSenderBlock)completion {
  [[IaSdkOrderingImpl shared] deleteOrderHistoryIOS:^(NSString *err) {
    completion(@[ err ?: [NSNull null] ]);
  }];
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
